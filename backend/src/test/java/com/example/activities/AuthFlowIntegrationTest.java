package com.example.activities;

import com.example.activities.model.User;
import com.example.activities.model.VerificationToken;
import com.example.activities.repository.UserRepository;
import com.example.activities.repository.VerificationTokenRepository;
import com.example.activities.service.VerificationService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:authflow;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.otp.max-attempts=3",
        "app.otp.lock-minutes=30",
        "app.otp.resend-cooldown-seconds=300"
})
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private VerificationService verificationService;

    @MockBean
    private JavaMailSender mailSender;

    @BeforeEach
    void setup() {
        verificationTokenRepository.deleteAll();
        userRepository.deleteAll();
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((Session) null));
        doNothing().when(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void registerVerifyLogin_happyPath() throws Exception {
        String email = "happy.path@example.com";
        String password = "S3curePass!12";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Happy User",
                                  "email": "%s",
                                  "password": "%s",
                                  "role": "student"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk());

        User createdUser = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertFalse(createdUser.getIsVerified());
        assertFalse(createdUser.getIsActive());

        VerificationToken token = verificationTokenRepository
                .findTopByUserIdAndUsedFalseOrderByExpiryDesc(createdUser.getId())
                .orElseThrow();

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "otp": "%s"
                                }
                                """.formatted(email, token.getToken())))
                .andExpect(status().isOk());

        User verifiedUser = userRepository.findById(createdUser.getId()).orElseThrow();
        assertTrue(verifiedUser.getIsVerified());
        assertTrue(verifiedUser.getIsActive());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void resendOtpWithinCooldown_doesNotIssueNewToken() throws Exception {
        String email = "cooldown@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Cooldown User",
                                  "email": "%s",
                                  "password": "S3curePass!12",
                                  "role": "student"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk());

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        VerificationToken firstToken = verificationTokenRepository
                .findTopByUserIdAndUsedFalseOrderByExpiryDesc(user.getId())
                .orElseThrow();

        mockMvc.perform(post("/api/auth/resend-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If eligible, a verification code has been sent."));

        VerificationToken afterResend = verificationTokenRepository
                .findTopByUserIdAndUsedFalseOrderByExpiryDesc(user.getId())
                .orElseThrow();

        assertEquals(firstToken.getId(), afterResend.getId());
        assertEquals(firstToken.getToken(), afterResend.getToken());
    }

    @Test
    void otpLockoutAfterMaxFailedAttempts_blocksCorrectOtpTemporarily() throws Exception {
        String email = "lockout@example.com";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Lockout User",
                                  "email": "%s",
                                  "password": "S3curePass!12",
                                  "role": "student"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk());

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        VerificationToken correctToken = verificationTokenRepository
                .findTopByUserIdAndUsedFalseOrderByExpiryDesc(user.getId())
                .orElseThrow();

        String wrongOtp = "000000";
        if (wrongOtp.equals(correctToken.getToken())) {
            wrongOtp = "111111";
        }

        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/verify")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "email": "%s",
                                      "otp": "%s"
                                    }
                                    """.formatted(email, wrongOtp)))
                    .andExpect(status().isBadRequest());
        }

        Optional<VerificationToken> updatedToken = verificationTokenRepository
                .findTopByUserIdAndUsedFalseOrderByExpiryDesc(user.getId());
        assertTrue(updatedToken.isPresent());
        assertTrue(updatedToken.get().getLockedUntil().isAfter(LocalDateTime.now()));

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "otp": "%s"
                                }
                                """.formatted(email, correctToken.getToken())))
                .andExpect(status().isBadRequest());

        User stillInactive = userRepository.findById(user.getId()).orElseThrow();
        assertFalse(stillInactive.getIsVerified());
        assertFalse(stillInactive.getIsActive());
        assertNotEquals(Boolean.TRUE, stillInactive.getIsVerified());
    }

    @Test
    void cleanupExpiredTokens_removesOnlyExpiredRecords() {
        VerificationToken expired = new VerificationToken();
        expired.setToken("123456");
        expired.setUserId("u-expired");
        expired.setExpiry(LocalDateTime.now().minusMinutes(1));
        expired.setLastSentAt(LocalDateTime.now().minusMinutes(2));
        verificationTokenRepository.save(expired);

        VerificationToken active = new VerificationToken();
        active.setToken("654321");
        active.setUserId("u-active");
        active.setExpiry(LocalDateTime.now().plusMinutes(10));
        active.setLastSentAt(LocalDateTime.now());
        verificationTokenRepository.save(active);

        verificationService.cleanupExpiredTokens();

        assertFalse(verificationTokenRepository.findByToken("123456").isPresent());
        assertTrue(verificationTokenRepository.findByToken("654321").isPresent());
    }
}

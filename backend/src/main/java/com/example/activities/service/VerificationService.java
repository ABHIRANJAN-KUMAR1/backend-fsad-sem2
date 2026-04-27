package com.example.activities.service;

import com.example.activities.model.User;
import com.example.activities.model.VerificationToken;
import com.example.activities.repository.VerificationTokenRepository;
import com.example.activities.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:5}")
    private int maxOtpAttempts;

    @Value("${app.otp.lock-minutes:15}")
    private int otpLockMinutes;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private int resendCooldownSeconds;

    @Value("${app.mail.from:noreply@activities.local}")
    private String mailFrom;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${app.mail.strict-delivery:true}")
    private boolean strictMailDelivery;

    private static final int OTP_LENGTH = 6;

    public String generateOTP() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    @Transactional
    public VerificationToken createTokenForUser(String userId) {
        tokenRepository.deleteByUserId(userId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusMinutes(otpExpiryMinutes);

        for (int attempt = 0; attempt < 20; attempt++) {
            String otp = generateOTP();
            if (tokenRepository.existsByToken(otp)) {
                continue;
            }
            VerificationToken token = new VerificationToken();
            token.setToken(otp);
            token.setUserId(userId);
            token.setExpiry(expiry);
            token.setFailedAttempts(0);
            token.setLastSentAt(now);
            token.setLockedUntil(null);
            try {
                return tokenRepository.save(token);
            } catch (DataIntegrityViolationException ex) {
                log.warn("Verification token collision for userId {} (attempt {}), regenerating", userId, attempt + 1);
            }
        }
        throw new IllegalStateException("Could not generate a unique verification code. Please try again.");
    }

    @Transactional
    public VerificationToken issueTokenWithCooldown(User user) {
        Optional<VerificationToken> existingToken = tokenRepository
                .findTopByUserIdAndUsedFalseOrderByExpiryDesc(user.getId())
                .filter(token -> LocalDateTime.now().isBefore(token.getExpiry()));

        if (existingToken.isPresent()) {
            LocalDateTime resendAllowedAt = existingToken.get().getLastSentAt().plusSeconds(resendCooldownSeconds);
            if (LocalDateTime.now().isBefore(resendAllowedAt)) {
                throw new IllegalStateException("Please wait before requesting another OTP");
            }
        }

        VerificationToken token = createTokenForUser(user.getId());
        sendVerificationEmail(user, token.getToken());
        return token;
    }

    public Optional<VerificationToken> findValidToken(String tokenValue, String userId) {
        return tokenRepository.findByTokenAndUserId(tokenValue, userId)
                .filter(token -> !token.isUsed())
                .filter(token -> token.getLockedUntil() == null || LocalDateTime.now().isAfter(token.getLockedUntil()))
                .filter(token -> LocalDateTime.now().isBefore(token.getExpiry()));
    }

    @Transactional
    public boolean verifyAndActivate(String email, String tokenValue) {
        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(email);
        if (optionalUser.isEmpty()) {
            return false;
        }

        User user = optionalUser.get();
        Optional<VerificationToken> validToken = findValidToken(tokenValue, user.getId());
        if (validToken.isPresent()) {
            VerificationToken token = validToken.get();
            token.setUsed(true);
            tokenRepository.save(token);

            user.setIsVerified(true);
            user.setIsActive(true);
            userRepository.save(user);
            return true;
        }

        registerFailedAttempt(user.getId());
        return false;
    }

    @Transactional
    public void registerFailedAttempt(String userId) {
        tokenRepository.findTopByUserIdAndUsedFalseOrderByExpiryDesc(userId)
                .filter(token -> LocalDateTime.now().isBefore(token.getExpiry()))
                .ifPresent(token -> {
                    if (token.getLockedUntil() != null && LocalDateTime.now().isBefore(token.getLockedUntil())) {
                        return;
                    }

                    int attempts = token.getFailedAttempts() + 1;
                    token.setFailedAttempts(attempts);
                    if (attempts >= maxOtpAttempts) {
                        token.setLockedUntil(LocalDateTime.now().plusMinutes(otpLockMinutes));
                        token.setFailedAttempts(0);
                    }
                    tokenRepository.save(token);
                });
    }

    @Transactional
    @Scheduled(cron = "${app.otp.cleanup-cron:0 */15 * * * *}")
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiryBefore(LocalDateTime.now());
    }

    public void sendVerificationEmail(User user, String otp) {
        if (smtpUsername == null || smtpUsername.isBlank()) {
            log.warn(
                    "SMTP not configured (spring.mail.username is empty). Verification OTP for {} is: {}",
                    user.getEmail(),
                    otp);
            if (strictMailDelivery) {
                throw new IllegalStateException(
                        "Email is not configured (spring.mail.username). Set MAIL_STRICT_DELIVERY=false for development.");
            }
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(java.util.Objects.requireNonNull(mailFrom));
            helper.setTo(java.util.Objects.requireNonNull(user.getEmail()));
            helper.setSubject("Verify your email - Activity Hub");
            helper.setText(java.util.Objects.requireNonNull("""
                    Hi %s,

                    Your verification code is: %s

                    It expires in %d minutes.

                    If you didn't request this, ignore this email.

                    Thanks,
                    Activity Hub Team
                    """.formatted(user.getName(), otp, otpExpiryMinutes)));

            mailSender.send(message);
            log.info("Verification email sent to {}", user.getEmail());
        } catch (Exception e) {
            handleSendFailure(user, otp, e);
        }
    }

    private void handleSendFailure(User user, String otp, Exception e) {
        log.error("Failed to send verification email to {}", user.getEmail(), e);
        log.warn("Verification OTP for {} (use if email did not arrive): {}", user.getEmail(), otp);
        if (strictMailDelivery) {
            throw new IllegalStateException("Email sending failed", e);
        }
    }
}

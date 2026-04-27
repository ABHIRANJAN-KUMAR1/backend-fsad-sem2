package com.example.activities.service;

import com.example.activities.dto.BroadcastRequest;
import com.example.activities.model.Broadcast;
import com.example.activities.model.User;
import com.example.activities.repository.BroadcastRepository;
import com.example.activities.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BroadcastService {

    private final BroadcastRepository repository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply-sac@college.edu}")
    private String fromEmail;

    public List<Broadcast> findAll() {
        return repository.findAll();
    }

    public Broadcast findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Broadcast not found"));
    }

    public Broadcast createAndSend(BroadcastRequest request, String createdBy) {
        Broadcast broadcast = new Broadcast();
        broadcast.setTitle(request.getTitle());
        broadcast.setMessage(request.getMessage());
        broadcast.setTargetRole(normalizeTargetRole(request.getTargetRole()));
        broadcast.setType(request.getType() == null ? "info" : request.getType().toLowerCase());
        broadcast.setSendEmail(Boolean.TRUE.equals(request.getSendEmail()));
        broadcast.setCreatedBy(createdBy);

        List<User> recipients = getRecipients(broadcast.getTargetRole());
        broadcast.setRecipientCount(recipients.size());

        if (!broadcast.getSendEmail()) {
            broadcast.setStatus("SENT");
            broadcast.setSentAt(LocalDateTime.now());
            return repository.save(broadcast);
        }

        int sent = 0;
        int failed = 0;
        String firstFailureReason = null;

        for (User recipient : recipients) {
            try {
                sendEmailToRecipient(recipient, broadcast);
                sent++;
            } catch (Exception ex) {
                failed++;
                if (firstFailureReason == null) {
                    firstFailureReason = ex.getMessage();
                }
            }
        }

        broadcast.setEmailSentCount(sent);
        broadcast.setEmailFailedCount(failed);
        broadcast.setStatus(resolveStatus(sent, failed, recipients.size()));
        broadcast.setFailureReason(firstFailureReason);
        broadcast.setSentAt(LocalDateTime.now());
        return repository.save(broadcast);
    }

    public Broadcast update(String id, BroadcastRequest request) {
        Broadcast existing = findById(id);
        if (request.getTitle() != null) existing.setTitle(request.getTitle());
        if (request.getMessage() != null) existing.setMessage(request.getMessage());
        if (request.getTargetRole() != null) existing.setTargetRole(normalizeTargetRole(request.getTargetRole()));
        if (request.getType() != null) existing.setType(request.getType().toLowerCase());
        if (request.getSendEmail() != null) existing.setSendEmail(request.getSendEmail());
        return repository.save(existing);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    public Map<String, Integer> getRecipientPreview() {
        List<User> allUsers = userRepository.findAll();
        int total = allUsers.size();
        int students = 0;
        int admins = 0;
        int coordinators = 0;

        for (User user : allUsers) {
            String role = normalizeRoleToken(user.getRole());
            if ("student".equals(role)) students++;
            if ("admin".equals(role)) admins++;
            if ("coordinator".equals(role)) coordinators++;
        }

        Map<String, Integer> preview = new HashMap<>();
        preview.put("all", total);
        preview.put("student", students);
        preview.put("admin", admins);
        preview.put("coordinator", coordinators);
        return preview;
    }

    private List<User> getRecipients(String targetRole) {
        List<User> allUsers = userRepository.findAll();
        String normalizedTarget = normalizeRoleToken(targetRole);

        if ("all".equals(normalizedTarget)) {
            return allUsers;
        }

        List<User> recipients = new ArrayList<>();
        for (User user : allUsers) {
            if (normalizeRoleToken(user.getRole()).equals(normalizedTarget)) {
                recipients.add(user);
            }
        }
        return recipients;
    }

    private void sendEmailToRecipient(User recipient, Broadcast broadcast) {
        if (recipient.getEmail() == null || recipient.getEmail().isBlank()) {
            throw new RuntimeException("Recipient has no email.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(recipient.getEmail());
        message.setSubject("[SAC Broadcast] " + broadcast.getTitle());
        message.setText(
                "Hello " + recipient.getName() + ",\n\n"
                        + broadcast.getMessage() + "\n\n"
                        + "Regards,\nStudent Activity Center"
        );
        mailSender.send(message);
    }

    private String resolveStatus(int sent, int failed, int total) {
        if (total == 0) return "FAILED";
        if (failed == 0) return "SENT";
        if (sent > 0) return "PARTIAL";
        return "FAILED";
    }

    private String normalizeTargetRole(String role) {
        if (role == null || role.isBlank()) return "all";
        String normalized = role.trim().toLowerCase(Locale.ROOT);
        if ("students".equals(normalized)) return "student";
        if ("admins".equals(normalized)) return "admin";
        return normalized;
    }

    private String normalizeRoleToken(String role) {
        if (role == null) return "";
        String normalized = role.trim().toLowerCase(Locale.ROOT);
        if ("students".equals(normalized)) return "student";
        if ("admins".equals(normalized)) return "admin";
        if ("coordinators".equals(normalized)) return "coordinator";
        return normalized;
    }
}
package com.example.activities.service;

import com.example.activities.model.Activity;
import com.example.activities.model.User;
import com.example.activities.repository.ActivityRepository;
import com.example.activities.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository repository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply-sac@college.edu}")
    private String fromEmail;

    public List<Activity> findAll() {
        return repository.findAll();
    }

    public Activity findById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found: " + id));
    }

    @SuppressWarnings("null")
    public Activity save(Activity entity) {
        return repository.save(entity);
    }

    public Activity createAndNotifyStudents(Activity entity) {
        if (entity.getCreatedAt() == null || entity.getCreatedAt().isBlank()) {
            entity.setCreatedAt(LocalDateTime.now().toString());
        }
        Activity saved = repository.save(entity);

        // Include legacy role formats like "students" or uppercase variants.
        List<User> students = userRepository.findAll().stream()
                .filter(this::isStudentRole)
                .toList();

        if (students.isEmpty()) {
            log.warn("No student recipients found for activity notification: {}", saved.getTitle());
            return saved;
        }

        int sent = 0;
        int failed = 0;
        for (User student : students) {
            if (student.getEmail() == null || student.getEmail().isBlank()) {
                failed++;
                continue;
            }
            if (student.getIsActive() != null && !student.getIsActive()) {
                continue;
            }
            try {
                sendNewActivityEmail(saved, student);
                sent++;
            } catch (Exception ex) {
                failed++;
                // keep activity creation successful even if some emails fail
                log.warn("Failed sending activity notification to {}: {}", student.getEmail(), ex.getMessage());
            }
        }
        log.info("Activity '{}' notifications -> sent: {}, failed: {}", saved.getTitle(), sent, failed);
        return saved;
    }

    public Activity update(String id, Activity incoming) {
        Activity existing = findById(id);

        if (incoming.getTitle() != null)            existing.setTitle(incoming.getTitle());
        if (incoming.getDescription() != null)      existing.setDescription(incoming.getDescription());
        if (incoming.getCategory() != null)         existing.setCategory(incoming.getCategory());
        if (incoming.getDate() != null)             existing.setDate(incoming.getDate());
        if (incoming.getStartTime() != null)        existing.setStartTime(incoming.getStartTime());
        if (incoming.getEndTime() != null)          existing.setEndTime(incoming.getEndTime());
        if (incoming.getVenue() != null)            existing.setVenue(incoming.getVenue());
        if (incoming.getMaxParticipants() != null)  existing.setMaxParticipants(incoming.getMaxParticipants());
        if (incoming.getCurrentParticipants() != null) existing.setCurrentParticipants(incoming.getCurrentParticipants());
        if (incoming.getWaitlist() != null)         existing.setWaitlist(incoming.getWaitlist());
        if (incoming.getTags() != null)             existing.setTags(incoming.getTags());

        return repository.save(existing);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    private void sendNewActivityEmail(Activity activity, User student) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(student.getEmail());
        message.setSubject("[SAC] New Activity: " + activity.getTitle());
        message.setText(
                "Hello " + student.getName() + ",\n\n"
                        + "A new activity has been created.\n\n"
                        + "Title: " + activity.getTitle() + "\n"
                        + "Category: " + (activity.getCategory() == null ? "-" : activity.getCategory()) + "\n"
                        + "Date: " + (activity.getDate() == null ? "-" : activity.getDate()) + "\n"
                        + "Time: " + (activity.getStartTime() == null ? "-" : activity.getStartTime())
                        + " - " + (activity.getEndTime() == null ? "-" : activity.getEndTime()) + "\n"
                        + "Venue: " + (activity.getVenue() == null ? "-" : activity.getVenue()) + "\n\n"
                        + "Please check the Student Activity Center portal to register.\n\n"
                        + "Regards,\nStudent Activity Center"
        );
        mailSender.send(message);
    }

    private boolean isStudentRole(User user) {
        if (user.getRole() == null) return false;
        String role = user.getRole().trim().toLowerCase(Locale.ROOT);
        return "student".equals(role) || "students".equals(role);
    }
}
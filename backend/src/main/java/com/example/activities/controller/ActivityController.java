package com.example.activities.controller;

import com.example.activities.model.Activity;
import com.example.activities.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService service;

    @GetMapping
    public List<Activity> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Activity> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<Activity> create(@RequestBody Activity entity) {
        // Frontend generates its own id; clear it so DB generates a clean UUID
        entity.setId(null);
        return ResponseEntity.ok(service.createAndNotifyStudents(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Activity> update(@PathVariable String id, @RequestBody Activity entity) {
        entity.setId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    // ── Participant Registration ──────────────────────────────────────────────

    @PostMapping("/{id}/register")
    public ResponseEntity<Activity> register(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        Activity activity = service.findById(id);
        if (!activity.getCurrentParticipants().contains(userId)) {
            activity.getCurrentParticipants().add(userId);
            activity.getWaitlist().remove(userId);
            service.save(activity);
        }
        return ResponseEntity.ok(activity);
    }

    @PostMapping("/{id}/unregister")
    public ResponseEntity<Activity> unregister(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        Activity activity = service.findById(id);
        activity.getCurrentParticipants().remove(userId);
        service.save(activity);
        return ResponseEntity.ok(activity);
    }

    @PostMapping("/{id}/waitlist")
    public ResponseEntity<Activity> joinWaitlist(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        Activity activity = service.findById(id);
        if (!activity.getWaitlist().contains(userId)) {
            activity.getWaitlist().add(userId);
            service.save(activity);
        }
        return ResponseEntity.ok(activity);
    }

    @PostMapping("/{id}/leave-waitlist")
    public ResponseEntity<Activity> leaveWaitlist(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        Activity activity = service.findById(id);
        activity.getWaitlist().remove(userId);
        service.save(activity);
        return ResponseEntity.ok(activity);
    }

    // ── Comments & Ratings (acknowledged but managed client-side) ─────────────

    @PostMapping("/{id}/comments")
    public ResponseEntity<Activity> addComment(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        // Comments are stored client-side; just return 200 so client doesn't error
        Activity activity = service.findById(id);
        return ResponseEntity.ok(activity);
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String id,
            @PathVariable String commentId) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/ratings")
    public ResponseEntity<Activity> addRating(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Activity activity = service.findById(id);
        return ResponseEntity.ok(activity);
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<Activity> addPhoto(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        Activity activity = service.findById(id);
        return ResponseEntity.ok(activity);
    }
}
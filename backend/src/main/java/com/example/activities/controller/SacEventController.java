package com.example.activities.controller;

import com.example.activities.dto.SacEventRequest;
import com.example.activities.model.Activity;
import com.example.activities.security.AuthService;
import com.example.activities.security.AuthUser;
import com.example.activities.service.SacEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sac/events")
@RequiredArgsConstructor
public class SacEventController {

    private final SacEventService sacEventService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<Activity>> getAllEvents(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        AuthUser user = authService.resolveUser(authHeader);
        if (authService.hasAnyRole(user, "coordinator")) {
            return ResponseEntity.ok(sacEventService.getCoordinatorEvents(user.getId()));
        }
        return ResponseEntity.ok(sacEventService.getAllEvents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Activity> getEvent(@PathVariable String id) {
        return ResponseEntity.ok(sacEventService.getEventById(id));
    }

    @PostMapping
    public ResponseEntity<?> createEvent(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SacEventRequest request) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin", "coordinator")) {
            return forbidden("Only admin or coordinator can create events.");
        }
        Activity created = sacEventService.createEvent(request, user.getId(), user.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody SacEventRequest request) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin", "coordinator")) {
            return forbidden("Only admin or coordinator can update events.");
        }
        Activity existing = sacEventService.getEventById(id);
        if (authService.hasAnyRole(user, "coordinator") && !user.getId().equals(existing.getCoordinatorId())) {
            return forbidden("Coordinator can update only own events.");
        }
        return ResponseEntity.ok(sacEventService.updateEvent(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        AuthUser user = authService.resolveUser(authHeader);
        if (!authService.hasAnyRole(user, "admin")) {
            return forbidden("Only admin can delete events.");
        }
        sacEventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<Map<String, String>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", message));
    }
}

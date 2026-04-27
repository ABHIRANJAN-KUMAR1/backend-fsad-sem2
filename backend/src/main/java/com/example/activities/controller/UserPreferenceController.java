package com.example.activities.controller;

import com.example.activities.model.UserPreference;
import com.example.activities.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-preferences")
@RequiredArgsConstructor
public class UserPreferenceController {

    private final UserPreferenceService service;

    @GetMapping
    public List<UserPreference> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserPreference> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserPreference> create(@RequestBody UserPreference entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserPreference> update(@PathVariable String id, @RequestBody UserPreference entity) {
        entity.setId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @PostMapping("/{id}/update-from-activity")
    public ResponseEntity<UserPreference> updateFromActivity(
            @PathVariable String id,
            @RequestBody Map<String, Object> activityData) {
        return ResponseEntity.ok(service.updateFromActivity(id, activityData));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
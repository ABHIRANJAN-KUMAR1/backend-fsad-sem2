package com.example.activities.controller;

import com.example.activities.model.ActivityHistory;
import com.example.activities.service.ActivityHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-historys")
@RequiredArgsConstructor
public class ActivityHistoryController {

    private final ActivityHistoryService service;

    @GetMapping
    public List<ActivityHistory> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityHistory> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ActivityHistory>> getByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(service.findByUserId(userId));
    }

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<ActivityHistory>> getByActivityId(@PathVariable String activityId) {
        return ResponseEntity.ok(service.findByActivityId(activityId));
    }

    @PostMapping
    public ResponseEntity<ActivityHistory> create(@RequestBody ActivityHistory entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @PostMapping("/register")
    public ResponseEntity<ActivityHistory> register(@RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(service.register(payload));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ActivityHistory> cancel(@PathVariable String id) {
        return ResponseEntity.ok(service.markCancelled(id));
    }

    @PostMapping("/{id}/attend")
    public ResponseEntity<ActivityHistory> attend(@PathVariable String id) {
        return ResponseEntity.ok(service.markAttended(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivityHistory> update(@PathVariable String id, @RequestBody ActivityHistory entity) {
        entity.setId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
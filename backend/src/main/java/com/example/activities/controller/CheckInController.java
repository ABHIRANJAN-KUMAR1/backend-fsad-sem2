package com.example.activities.controller;

import com.example.activities.model.CheckIn;
import com.example.activities.service.CheckInService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService service;

    @GetMapping
    public List<CheckIn> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CheckIn> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<CheckIn> create(@RequestBody CheckIn entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<CheckIn>> getByActivity(@PathVariable String activityId) {
        return ResponseEntity.ok(service.findByActivityId(activityId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CheckIn>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(service.findByUserId(userId));
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkCheckIn(@RequestBody Map<String, Object> body) {
        String activityId = body.getOrDefault("activityId", "").toString();
        @SuppressWarnings("unchecked")
        List<String> userIds = (List<String>) body.getOrDefault("userIds", List.of());
        String checkedInBy = body.getOrDefault("checkedInBy", "").toString();
        return ResponseEntity.ok(service.bulkCheckIn(activityId, userIds, checkedInBy));
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<CheckIn> checkOut(@PathVariable String id) {
        return ResponseEntity.ok(service.checkOut(id));
    }

    @PostMapping("/qr-token/{activityId}")
    public ResponseEntity<Map<String, String>> generateQrToken(@PathVariable String activityId) {
        return ResponseEntity.ok(Map.of("token", activityId, "activityId", activityId));
    }

    @PostMapping("/qr-checkin")
    public ResponseEntity<CheckIn> qrCheckIn(@RequestBody Map<String, String> body) {
        CheckIn checkIn = new CheckIn();
        checkIn.setActivityId(body.get("activityId"));
        checkIn.setUserId(body.get("userId"));
        checkIn.setUserName(body.getOrDefault("userName", body.getOrDefault("userId", "")));
        checkIn.setCheckedInBy(body.getOrDefault("checkedInBy", "qr"));
        return ResponseEntity.ok(service.save(checkIn));
    }

    @GetMapping("/report/{activityId}")
    public ResponseEntity<Map<String, Object>> getReport(@PathVariable String activityId) {
        return ResponseEntity.ok(service.buildReport(activityId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CheckIn> update(@PathVariable String id, @RequestBody CheckIn entity) {
        entity.setId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
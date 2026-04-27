package com.example.activities.controller;

import com.example.activities.model.Favorite;
import com.example.activities.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService service;

    @GetMapping
    public List<Favorite> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Favorite> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Favorite>> getByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(service.findByUserId(userId));
    }

    @GetMapping("/{userId}/{activityId}")
    public ResponseEntity<Map<String, Object>> checkFavorite(
            @PathVariable String userId,
            @PathVariable String activityId) {
        Favorite favorite = service.findByUserIdAndActivityId(userId, activityId);
        return ResponseEntity.ok(Map.of(
                "isFavorite", favorite != null,
                "favoriteId", favorite != null ? favorite.getId() : ""
        ));
    }

    @PostMapping
    public ResponseEntity<Favorite> create(@RequestBody Favorite entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Favorite> update(@PathVariable String id, @RequestBody Favorite entity) {
        entity.setId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/user/{userId}/activity/{activityId}")
    public ResponseEntity<Void> deleteByUserAndActivity(
            @PathVariable String userId,
            @PathVariable String activityId) {
        service.deleteByUserIdAndActivityId(userId, activityId);
        return ResponseEntity.ok().build();
    }
}
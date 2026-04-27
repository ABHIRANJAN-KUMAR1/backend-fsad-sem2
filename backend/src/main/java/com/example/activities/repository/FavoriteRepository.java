package com.example.activities.repository;

import com.example.activities.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    List<Favorite> findByUserId(String userId);

    Optional<Favorite> findByUserIdAndActivityId(String userId, String activityId);

    boolean existsByUserIdAndActivityId(String userId, String activityId);

    void deleteByUserIdAndActivityId(String userId, String activityId);
}
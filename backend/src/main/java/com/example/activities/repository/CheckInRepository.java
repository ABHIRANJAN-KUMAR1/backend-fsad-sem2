package com.example.activities.repository;

import com.example.activities.model.CheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, String> {
	List<CheckIn> findByActivityId(String activityId);

	List<CheckIn> findByUserId(String userId);

	boolean existsByActivityIdAndUserId(String activityId, String userId);

	Optional<CheckIn> findFirstByActivityIdAndUserIdOrderByCheckedInAtDesc(String activityId, String userId);
}
package com.example.activities.service;

import com.example.activities.model.CheckIn;
import com.example.activities.repository.CheckInRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final CheckInRepository repository;

    public List<CheckIn> findAll() {
        return repository.findAll();
    }

    public List<CheckIn> findByActivityId(String activityId) {
        return repository.findByActivityId(activityId);
    }

    public List<CheckIn> findByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    public CheckIn findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("CheckIn not found"));
    }

    public CheckIn save(CheckIn entity) {
        validateRequiredFields(entity);

        boolean isCreate = !StringUtils.hasText(entity.getId());
        if (isCreate) {
            CheckIn latest = repository
                    .findFirstByActivityIdAndUserIdOrderByCheckedInAtDesc(entity.getActivityId(), entity.getUserId())
                    .orElse(null);

            // Idempotency guard: if the client retries the same check-in request, reuse existing row.
            if (latest != null && latest.getCheckedOutAt() == null) {
                return latest;
            }
        }

        if (entity.getCheckedInAt() == null) {
            entity.setCheckedInAt(LocalDateTime.now());
        }
        return repository.save(entity);
    }

    public CheckIn checkOut(String id) {
        CheckIn checkIn = findById(id);
        checkIn.setCheckedOutAt(LocalDateTime.now());
        return repository.save(checkIn);
    }

    public Map<String, Object> bulkCheckIn(String activityId, List<String> userIds, String checkedInBy) {
        List<Map<String, Object>> results = new java.util.ArrayList<>();

        for (String userId : userIds) {
            Map<String, Object> result = new HashMap<>();
            result.put("userId", userId);

            if (repository.existsByActivityIdAndUserId(activityId, userId)) {
                result.put("status", "skipped");
                result.put("message", "Already checked in");
                results.add(result);
                continue;
            }

            CheckIn checkIn = new CheckIn();
            checkIn.setActivityId(activityId);
            checkIn.setUserId(userId);
            checkIn.setUserName(userId);
            checkIn.setCheckedInBy(checkedInBy);
            checkIn.setCheckedInAt(LocalDateTime.now());
            repository.save(checkIn);

            result.put("status", "success");
            result.put("checkIn", checkIn);
            results.add(result);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("results", results);
        return response;
    }

    public Map<String, Object> buildReport(String activityId) {
        List<CheckIn> checkIns = findByActivityId(activityId);
        StringBuilder csv = new StringBuilder();
        csv.append("CheckInId,ActivityId,UserId,UserName,CheckedInAt,CheckedInBy,CheckedOutAt\n");
        for (CheckIn checkIn : checkIns) {
            csv.append(nullSafe(checkIn.getId())).append(',')
               .append(nullSafe(checkIn.getActivityId())).append(',')
               .append(nullSafe(checkIn.getUserId())).append(',')
               .append(nullSafe(checkIn.getUserName())).append(',')
               .append(nullSafe(checkIn.getCheckedInAt())).append(',')
               .append(nullSafe(checkIn.getCheckedInBy())).append(',')
               .append(nullSafe(checkIn.getCheckedOutAt())).append('\n');
        }

        Map<String, Object> response = new HashMap<>();
        response.put("csvExport", csv.toString());
        response.put("count", checkIns.size());
        return response;
    }

    private String nullSafe(Object value) {
        return value == null ? "" : value.toString();
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    private void validateRequiredFields(CheckIn entity) {
        if (!StringUtils.hasText(entity.getActivityId())) {
            throw new IllegalArgumentException("activityId is required");
        }
        if (!StringUtils.hasText(entity.getUserId())) {
            throw new IllegalArgumentException("userId is required");
        }
    }
}
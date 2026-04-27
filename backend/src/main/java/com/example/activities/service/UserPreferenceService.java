package com.example.activities.service;

import com.example.activities.model.UserPreference;
import com.example.activities.repository.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserPreferenceService {

    private final UserPreferenceRepository repository;

    public List<UserPreference> findAll() {
        return repository.findAll();
    }

    public UserPreference findById(String id) {
        return repository.findById(id).orElseGet(() -> buildDefault(id));
    }

    public UserPreference save(UserPreference entity) {
        if (!StringUtils.hasText(entity.getId())) {
            throw new IllegalArgumentException("userId is required");
        }
        normalize(entity);
        return repository.save(entity);
    }

    public UserPreference updateFromActivity(String userId, Map<String, Object> activityData) {
        UserPreference pref = findById(userId);
        pref.setId(userId);
        normalize(pref);

        String category = stringValue(activityData.get("activityCategory"));
        String venue = stringValue(activityData.get("activityVenue"));
        String startTime = stringValue(activityData.get("activityStartTime"));
        String activityDate = stringValue(activityData.get("activityDate"));
        Double rating = doubleValue(activityData.get("rating"));

        if (StringUtils.hasText(category)) {
            pref.getCategoryPreferences().put(category, pref.getCategoryPreferences().getOrDefault(category, 0) + 10);
            pref.getActivityCountByCategory().put(category, pref.getActivityCountByCategory().getOrDefault(category, 0) + 1);
        }

        if (StringUtils.hasText(venue) && !pref.getVenuePreferences().contains(venue)) {
            pref.getVenuePreferences().add(venue);
            if (pref.getVenuePreferences().size() > 5) {
                pref.setVenuePreferences(new ArrayList<>(pref.getVenuePreferences().subList(pref.getVenuePreferences().size() - 5, pref.getVenuePreferences().size())));
            }
        }

        if (StringUtils.hasText(startTime) && "afternoon".equalsIgnoreCase(pref.getTimePreference())) {
            pref.setTimePreference(resolveTimePreference(startTime));
        }

        if (StringUtils.hasText(activityDate) && "any".equalsIgnoreCase(pref.getDayPreference())) {
            pref.setDayPreference(resolveDayPreference(activityDate));
        }

        int previousTotal = pref.getTotalActivities() == null ? 0 : pref.getTotalActivities();
        pref.setTotalActivities(previousTotal + 1);

        if (rating != null && rating > 0) {
            double prevAvg = pref.getAverageRatingGiven() == null ? 0.0 : pref.getAverageRatingGiven();
            int newTotal = pref.getTotalActivities();
            pref.setAverageRatingGiven(((prevAvg * Math.max(0, newTotal - 1)) + rating) / Math.max(1, newTotal));
        }

        return repository.save(pref);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    private UserPreference buildDefault(String userId) {
        UserPreference pref = new UserPreference();
        pref.setId(userId);
        normalize(pref);
        return pref;
    }

    private void normalize(UserPreference entity) {
        if (entity.getCategoryPreferences() == null) entity.setCategoryPreferences(new java.util.HashMap<>());
        if (entity.getActivityCountByCategory() == null) entity.setActivityCountByCategory(new java.util.HashMap<>());
        if (entity.getVenuePreferences() == null) entity.setVenuePreferences(new ArrayList<>());
        if (!StringUtils.hasText(entity.getTimePreference())) entity.setTimePreference("afternoon");
        if (!StringUtils.hasText(entity.getDayPreference())) entity.setDayPreference("any");
        if (entity.getTotalActivities() == null) entity.setTotalActivities(0);
        if (entity.getAverageRatingGiven() == null) entity.setAverageRatingGiven(0.0);
    }

    private String stringValue(Object value) {
        if (value == null) return "";
        return String.valueOf(value).trim();
    }

    private Double doubleValue(Object value) {
        if (value == null) return null;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return null;
        }
    }

    private String resolveTimePreference(String startTime) {
        try {
            int hour = Integer.parseInt(startTime.split(":")[0]);
            if (hour >= 6 && hour < 12) return "morning";
            if (hour >= 12 && hour < 17) return "afternoon";
            if (hour >= 17 && hour < 21) return "evening";
            return "night";
        } catch (Exception ignored) {
            return "afternoon";
        }
    }

    private String resolveDayPreference(String dateValue) {
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(dateValue);
            java.time.DayOfWeek day = date.getDayOfWeek();
            if (day == java.time.DayOfWeek.SATURDAY || day == java.time.DayOfWeek.SUNDAY) {
                return "weekend";
            }
            return "weekday";
        } catch (Exception ignored) {
            return "any";
        }
    }
}
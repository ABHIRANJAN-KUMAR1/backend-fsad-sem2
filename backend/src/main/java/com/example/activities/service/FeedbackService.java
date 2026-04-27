package com.example.activities.service;

import com.example.activities.model.Feedback;
import com.example.activities.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository repository;

    public List<Feedback> findAll() {
        return repository.findAll();
    }

    public Feedback findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Feedback not found"));
    }

    public Feedback save(Feedback entity) {
        return repository.save(entity);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
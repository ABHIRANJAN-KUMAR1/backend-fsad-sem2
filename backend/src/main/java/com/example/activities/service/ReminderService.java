package com.example.activities.service;

import com.example.activities.model.Reminder;
import com.example.activities.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository repository;

    public List<Reminder> findAll() {
        return repository.findAll();
    }

    public Reminder findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Reminder not found"));
    }

    public Reminder save(Reminder entity) {
        return repository.save(entity);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
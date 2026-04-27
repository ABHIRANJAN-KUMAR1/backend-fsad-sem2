package com.example.activities.service;

import com.example.activities.model.Tag;
import com.example.activities.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository repository;

    public List<Tag> findAll() {
        return repository.findAll();
    }

    public Tag findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Tag not found"));
    }

    public Tag save(Tag entity) {
        return repository.save(entity);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
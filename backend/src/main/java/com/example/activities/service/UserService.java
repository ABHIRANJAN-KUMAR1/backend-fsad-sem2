package com.example.activities.service;

import com.example.activities.model.User;
import com.example.activities.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;

    public List<User> findAll() {
        return repository.findAll();
    }

    public User findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User save(User entity) {
        return repository.save(entity);
    }

    public Optional<User> findByEmail(String email) {
        return repository.findByEmailIgnoreCase(email);
    }

    public boolean existsByEmail(String email) {
        return repository.findByEmailIgnoreCase(email).isPresent();
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
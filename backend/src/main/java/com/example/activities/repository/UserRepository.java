package com.example.activities.repository;

import com.example.activities.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    java.util.Optional<User> findByEmail(String email);
    java.util.Optional<User> findByEmailIgnoreCase(String email);
    List<User> findByRoleIgnoreCase(String role);
}

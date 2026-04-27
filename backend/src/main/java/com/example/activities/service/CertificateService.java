package com.example.activities.service;

import com.example.activities.model.Certificate;
import com.example.activities.repository.CertificateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository repository;

    public List<Certificate> findAll() {
        return repository.findAll();
    }

    public Certificate findById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    public Certificate save(Certificate entity) {
        return repository.save(entity);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
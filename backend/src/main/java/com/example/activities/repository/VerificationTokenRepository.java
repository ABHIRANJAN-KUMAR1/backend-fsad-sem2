package com.example.activities.repository;

import com.example.activities.model.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, String> {
    Optional<VerificationToken> findByToken(String token);
    Optional<VerificationToken> findByTokenAndUserId(String token, String userId);
    Optional<VerificationToken> findTopByUserIdAndUsedFalseOrderByExpiryDesc(String userId);

    boolean existsByToken(String token);

    @Modifying
    @Query("delete from VerificationToken t where t.userId = :userId")
    void deleteByUserId(@Param("userId") String userId);

    @Modifying
    @Query("delete from VerificationToken t where t.expiry < :time")
    void deleteByExpiryBefore(@Param("time") LocalDateTime time);
}

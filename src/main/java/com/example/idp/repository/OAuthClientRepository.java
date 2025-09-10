package com.example.idp.repository;

import com.example.idp.entity.OAuthClient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OAuthClientRepository extends JpaRepository<OAuthClient, Long> {
    
    Optional<OAuthClient> findByClientId(String clientId);
    
    boolean existsByClientId(String clientId);
    
    Optional<OAuthClient> findByClientIdAndIsActiveTrue(String clientId);
}

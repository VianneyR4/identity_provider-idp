package com.example.idp.repository;

import com.example.idp.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    
    List<UserRole> findByUserId(Long userId);
    
    List<UserRole> findByRole(String role);
    
    Optional<UserRole> findByUserIdAndRole(Long userId, String role);
    
    boolean existsByUserIdAndRole(Long userId, String role);
    
    @Query("SELECT ur.role FROM UserRole ur WHERE ur.user.id = :userId")
    List<String> findRolesByUserId(@Param("userId") Long userId);
    
    @Query("SELECT ur.role FROM UserRole ur WHERE ur.user.id = :userId")
    List<String> findRoleNamesByUserId(@Param("userId") Long userId);
    
    void deleteByUserIdAndRole(Long userId, String role);
}

package com.example.activities.security;

import java.io.IOException;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.activities.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // Skip authentication for public endpoints
        String path = request.getRequestURI();
        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            if (jwtUtils.isTokenValid(token)) {
                String email = jwtUtils.getUsernameFromToken(token);
                userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
                    if (Boolean.TRUE.equals(user.getIsActive()) && Boolean.TRUE.equals(user.getIsVerified())) {
                        String rawRole = user.getRole() == null ? "student" : user.getRole().trim();
                        String roleKey = rawRole.isEmpty() ? "STUDENT" : rawRole.toUpperCase();
                        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + roleKey));
                        AuthUser principal = new AuthUser(user.getId(), user.getEmail(), rawRole.toLowerCase());
                        var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                });
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        return path.startsWith("/api/auth/") ||
               path.startsWith("/api/users/register") ||
               path.startsWith("/api/users/login") ||
               path.equals("/api/ping") ||
               path.equals("/error");
    }
}
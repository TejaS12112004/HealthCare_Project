package com.healthcare.service;

import com.healthcare.exception.ResourceNotFoundException;
import com.healthcare.model.dto.response.DoctorAvailabilityResponse;
import com.healthcare.model.dto.response.DoctorResponse;
import com.healthcare.model.dto.response.PageResponse;
import com.healthcare.model.dto.response.SlotResponse;
import com.healthcare.model.entity.Doctor;
import com.healthcare.model.entity.DoctorWorkingHours;
import com.healthcare.repository.DoctorRepository;
import com.healthcare.repository.DoctorWorkingHoursRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorWorkingHoursRepository workingHoursRepository;
    private final SlotService slotService;

    @Transactional(readOnly = true)
    public PageResponse<DoctorAvailabilityResponse> searchDoctors(String specialisation, LocalDate date, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("user.firstName").ascending());
        Page<Doctor> doctorPage;

        if (specialisation != null && !specialisation.trim().isEmpty()) {
            doctorPage = doctorRepository.findBySpecialisationName(specialisation, pageRequest);
        } else {
            // Find all active doctors
            doctorPage = doctorRepository.searchDoctors("", pageRequest); // Empty query searches all active
        }

        List<DoctorAvailabilityResponse> content = doctorPage.getContent().stream()
                .map(doctor -> toAvailabilityResponse(doctor, date))
                .collect(Collectors.toList());

        return PageResponse.<DoctorAvailabilityResponse>builder()
                .content(content)
                .pageNumber(doctorPage.getNumber())
                .pageSize(doctorPage.getSize())
                .totalElements(doctorPage.getTotalElements())
                .totalPages(doctorPage.getTotalPages())
                .last(doctorPage.isLast())
                .first(doctorPage.isFirst())
                .build();
    }
    
    @Transactional(readOnly = true)
    public DoctorAvailabilityResponse getDoctorProfile(UUID doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));
        return toAvailabilityResponse(doctor, date);
    }

    private DoctorAvailabilityResponse toAvailabilityResponse(Doctor doctor, LocalDate date) {
        List<DoctorWorkingHours> hours = workingHoursRepository.findByDoctorIdOrderByDayOfWeek(doctor.getId());
        
        List<DoctorResponse.WorkingHoursSummary> hoursSummary = hours.stream().map(h -> 
            DoctorResponse.WorkingHoursSummary.builder()
                .dayOfWeek(h.getDayOfWeek())
                .startTime(h.getStartTime())
                .endTime(h.getEndTime())
                .build()
        ).toList();

        DoctorAvailabilityResponse.DoctorAvailabilityResponseBuilder builder = DoctorAvailabilityResponse.builder()
                .id(doctor.getId())
                .firstName(doctor.getUser().getFirstName())
                .lastName(doctor.getUser().getLastName())
                .email(doctor.getUser().getEmail())
                .specialisation(doctor.getSpecialisation() != null ? doctor.getSpecialisation().getName() : null)
                .bio(doctor.getBio())
                .slotDurationMinutes(doctor.getSlotDurationMinutes())
                .isAvailable(doctor.getIsAvailable())
                .workingHours(hoursSummary);

        if (date != null) {
            builder.availableSlots(slotService.getAvailableSlotTimes(doctor.getId(), date));
            builder.nextAvailableDate(null);
        } else {
            builder.availableSlots(List.of());
            builder.nextAvailableDate(slotService.findNextAvailableDate(doctor.getId(), 14));
        }

        return builder.build();
    }
}

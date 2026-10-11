
package com.studentresult.student_result;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository repository;

    public StudentController(StudentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return repository.findAll();
    }

    @GetMapping("/{rollNo}")
    public ResponseEntity<Student> getStudent(
            @PathVariable String rollNo) {

        return repository.findById(rollNo)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                    ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> addStudent(
            @RequestBody Student student) {

        if (student.getRollNo() == null
                || student.getRollNo().isBlank()
                || student.getName() == null
                || student.getName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Roll number and name are required.");
        }

        int[] marks = {
            student.getSubject1(),
            student.getSubject2(),
            student.getSubject3(),
            student.getSubject4(),
            student.getSubject5()
        };

        for (int mark : marks) {
            if (mark < 0 || mark > 100) {
                return ResponseEntity.badRequest()
                        .body("Marks must be between 0 and 100.");
            }
        }

        if (repository.existsById(student.getRollNo())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Roll number already exists.");
        }

        Student savedStudent = repository.save(student);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedStudent);
    }

    @DeleteMapping("/{rollNo}")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable String rollNo) {

        if (!repository.existsById(rollNo)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(rollNo);
        return ResponseEntity.noContent().build();
    }
}

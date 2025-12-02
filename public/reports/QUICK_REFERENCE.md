# Quick Reference: Multiple Dates Template

## Template Structure

### Header Row (One row)
```
| No. | Name of Student | Course & Year | {date1} | {date2} | {date3} | ... | {date10} |
```

### Student Row (Inside {#students} loop)
```
{#students}
| {no} | {name} | {course_year} | {date1} | {date2} | {date3} | ... | {date10} |
{/students}
```

## Key Points

1. **Date Headers**: Use `{date1}` through `{date10}` in the header row
2. **Student Attendance**: Use the same `{date1}` through `{date10}` in each student row
3. **Attendance Values**: 
   - `✓` = Present (checkmark)
   - `L` = Late  
   - `X` = Absent
   - `E` = Excuse
   - Empty = No record for that date
4. **Column Count**: Create as many date columns as you need (up to 10). Empty columns will just show empty cells.

## Example Word Table Structure

```
┌────┬──────────────────┬─────────────┬────────────┬────────────┬────────────┐
│ No.│ Name of Student  │ Course &Year│ {date1}    │ {date2}    │ {date3}    │
├────┼──────────────────┼─────────────┼────────────┼────────────┼────────────┤
│{#students}                                                                    │
│ {no}│ {name}           │ {course_year}│ {date1}    │ {date2}    │ {date3}    │
│{/students}                                                                    │
└────┴──────────────────┴─────────────┴────────────┴────────────┴────────────┘
```

## What Gets Sent from API

- `date1`, `date2`, ... `date10` → Date strings (e.g., "November 28, 2025")
- Each student object has:
  - `no`, `name`, `course_year` → Basic info
  - `date1`, `date2`, ... `date10` → Attendance symbols (✓, L, X, or empty)

## Testing Checklist

- [ ] Template has date columns in header: `{date1}`, `{date2}`, etc.
- [ ] Student row has matching date columns: `{date1}`, `{date2}`, etc.
- [ ] All rows have the same number of columns
- [ ] `{#students}` and `{/students}` wrap the student data row
- [ ] Template saved and uploaded to `/public/reports/`


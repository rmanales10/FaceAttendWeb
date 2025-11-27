export interface ParsedCSVData {
    section: string; // e.g., "BSIT4D" (hyphens removed)
    courseCode: string; // e.g., "IT413"
    subjectName: string; // e.g., "Social and Professional Issues"
    facultyName: string; // e.g., "Marites Habagat" (converted from "Last, First" to "First Last")
    students: Array<{
        studentNo?: string;
        fullName: string;
    }>;
    schedules: Array<{
        day: string; // e.g., "M", "T"
        time: string; // e.g., "1:00 PM - 2:30 PM"
        room: string; // e.g., "Makeshift-06", "PHYSICS LABORATORY"
    }>;
    yearLevel: string; // e.g., "4th Year - Baccalaureate"
    department: string; // e.g., "BSIT"
}

// Helper function to clean and trim faculty name, keeping "Last, First" format
function cleanFacultyName(name: string): string {
    // Remove quotes and trim all whitespace (including trailing spaces)
    const cleaned = name.replace(/"/g, '').trim();
    // If it contains a comma, trim each part but keep the format
    if (cleaned.includes(',')) {
        const parts = cleaned.split(',').map(p => p.trim());
        return parts.join(', ');
    }
    return cleaned;
}

export function parseClassListCSV(csvText: string): ParsedCSVData | null {
    const lines = csvText.split('\n').map(line => line.trim());

    // Find key information
    let section = '';
    let courseCode = '';
    let subjectName = '';
    let facultyName = '';
    let yearLevel = '';
    let department = '';
    const schedules: Array<{ day: string; time: string; room: string }> = [];
    const students: Array<{ studentNo?: string; fullName: string }> = [];

    // Parse section (e.g., "BSIT-4D" or "BSIT 4D")
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for section pattern like "BSIT-4D" or "BSIT 4D" or "BSIT4D"
        const sectionMatch = line.match(/(BSIT|BSCS|BSIS|BSBA)[\s-]?(\d+[A-Z])/i);
        if (sectionMatch) {
            section = sectionMatch[0].replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
            break;
        }
        // Also check for "BSIT-4D" in class section column
        if (line.includes('Class Section') || line.includes('Class Section,')) {
            const parts = line.split(',');
            for (const part of parts) {
                const trimmed = part.trim();
                const match = trimmed.match(/(BSIT|BSCS|BSIS|BSBA)[\s-]?(\d+[A-Z])/i);
                if (match) {
                    section = match[0].replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
                    break;
                }
            }
        }
    }

    // Parse course code (e.g., "IT413")
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for course code pattern
        const codeMatch = line.match(/\b([A-Z]{2,4}\d{3,4})\b/);
        if (codeMatch && !courseCode) {
            courseCode = codeMatch[1];
        }
    }

    // Parse subject name (look for "Subject Title" row)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('Subject Title') || line.includes('Subject Title,')) {
            // Subject name is usually in the same line or next few lines
            const parts = line.split(',');
            for (let j = 0; j < parts.length; j++) {
                const part = parts[j].trim().replace(/"/g, '');
                if (part && part !== 'Subject Title' && part.length > 5 && !part.match(/^\d/) && !part.includes('Subject')) {
                    subjectName = part;
                    break;
                }
            }
            // If not found, check next line
            if (!subjectName && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                const nextParts = nextLine.split(',');
                for (const part of nextParts) {
                    const trimmed = part.trim().replace(/"/g, '');
                    if (trimmed && trimmed.length > 5 && !trimmed.match(/^\d/) && !trimmed.includes('Subject')) {
                        subjectName = trimmed;
                        break;
                    }
                }
            }
            // Also check the line after that
            if (!subjectName && i + 2 < lines.length) {
                const nextLine = lines[i + 2];
                const nextParts = nextLine.split(',');
                for (const part of nextParts) {
                    const trimmed = part.trim().replace(/"/g, '');
                    if (trimmed && trimmed.length > 5 && !trimmed.match(/^\d/) && !trimmed.includes('Subject')) {
                        subjectName = trimmed;
                        break;
                    }
                }
            }
        }
    }

    // Parse faculty name (look for "Faculty" row)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('Faculty') || line.includes('Faculty,')) {
            const parts = line.split(',');
            for (let j = 0; j < parts.length; j++) {
                let part = parts[j];
                // Check if part contains quoted name (e.g., "CARUMBA, PRINCE VIRNIEL  ")
                const quotedMatch = part.match(/"([^"]+)"/);
                if (quotedMatch) {
                    // Extract the name from quotes and clean it
                    facultyName = cleanFacultyName(quotedMatch[1]);
                    if (facultyName && facultyName !== 'Faculty' && facultyName.length > 2) {
                        break;
                    }
                } else {
                    // Try without quotes
                    part = part.trim().replace(/"/g, '');
                    if (part && part !== 'Faculty' && part.length > 2 && part.match(/^[A-Z]/)) {
                        // Check if it looks like a name (contains comma or is a proper name)
                        if (part.includes(',') || part.split(' ').length >= 2) {
                            // Keep "Last, First" format, just clean it
                            facultyName = cleanFacultyName(part);
                            break;
                        }
                    }
                }
            }
        }
    }

    // Parse year level
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('Year Level') || line.includes('Year Level,')) {
            const parts = line.split(',');
            for (const part of parts) {
                const trimmed = part.trim().replace(/"/g, '');
                if (trimmed && trimmed.includes('Year')) {
                    yearLevel = trimmed;
                    break;
                }
            }
        }
    }

    // Parse department (usually in section or course code area)
    if (section) {
        department = section.match(/^[A-Z]+/)?.[0] || 'BSIT';
    } else if (courseCode) {
        department = courseCode.match(/^[A-Z]+/)?.[0] || 'BSIT';
    }

    // Parse schedules (look for schedule lines)
    // Use a Set to track unique schedules
    const scheduleSet = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for schedule pattern: "M 1:00 PM - 2:30 PM (Makeshift-06)"
        // Also handle patterns like "Schedule(s),,,M 1:00 PM - 2:30 PM (Makeshift-06),,"
        // And standalone schedules like "T 3:00 PM - 4:30 PM (PHYSICS LABORATORY)"
        const scheduleMatch = line.match(/([MTWFS]{1,3})\s+(\d{1,2}:\d{2}\s+(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s+(?:AM|PM))\s*\(([^)]+)\)/i);
        if (scheduleMatch) {
            const scheduleKey = `${scheduleMatch[1]}|${scheduleMatch[2]}|${scheduleMatch[3]}`;
            if (!scheduleSet.has(scheduleKey)) {
                scheduleSet.add(scheduleKey);
                schedules.push({
                    day: scheduleMatch[1],
                    time: scheduleMatch[2],
                    room: scheduleMatch[3].trim() // Trim room name to remove extra spaces
                });
            }
        }
        // Also check for schedules in comma-separated format
        if (line.includes('Schedule') || line.includes('Schedule(s)')) {
            const parts = line.split(',');
            for (const part of parts) {
                const trimmed = part.trim();
                const match = trimmed.match(/([MTWFS]{1,3})\s+(\d{1,2}:\d{2}\s+(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s+(?:AM|PM))\s*\(([^)]+)\)/i);
                if (match) {
                    const scheduleKey = `${match[1]}|${match[2]}|${match[3]}`;
                    if (!scheduleSet.has(scheduleKey)) {
                        scheduleSet.add(scheduleKey);
                        schedules.push({
                            day: match[1],
                            time: match[2],
                            room: match[3].trim() // Trim room name to remove extra spaces
                        });
                    }
                }
            }
        }
        // Also check for schedules that might be on lines with mostly commas (continuation lines)
        // Pattern: mostly commas with a schedule at the end
        if (line.match(/^,{10,}/) || line.match(/^[\s,]+[MTWFS]/)) {
            const scheduleMatch2 = line.match(/([MTWFS]{1,3})\s+(\d{1,2}:\d{2}\s+(?:AM|PM)\s*-\s*\d{1,2}:\d{2}\s+(?:AM|PM))\s*\(([^)]+)\)/i);
            if (scheduleMatch2) {
                const scheduleKey = `${scheduleMatch2[1]}|${scheduleMatch2[2]}|${scheduleMatch2[3]}`;
                if (!scheduleSet.has(scheduleKey)) {
                    scheduleSet.add(scheduleKey);
                    schedules.push({
                        day: scheduleMatch2[1],
                        time: scheduleMatch2[2],
                        room: scheduleMatch2[3].trim() // Trim room name to remove extra spaces
                    });
                }
            }
        }
    }

    // Parse students (look for student data rows)
    // Students usually start after a header row with "#", "Student No", "Full Name"
    let studentDataStart = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if we've reached the student data section
        if (line.includes('#') && (line.includes('Student No') || line.includes('Full Name'))) {
            studentDataStart = true;
            continue;
        }

        if (studentDataStart) {
            // Skip empty lines and summary lines
            if (!line || line.length < 5) {
                continue;
            }

            // Skip lines that are clearly not student data
            const lowerLine = line.toLowerCase();
            if (
                line.includes('TOTAL NUMBER') ||
                line.includes('Page') ||
                line.includes('Date Printed') ||
                line.includes('OFFICIAL LIST') ||
                line.includes('ip-') ||
                line.includes('.compute.internal') ||
                line.includes('November') ||
                line.includes('December') ||
                line.includes('January') ||
                line.includes('February') ||
                line.includes('March') ||
                line.includes('April') ||
                line.includes('May') ||
                line.includes('June') ||
                line.includes('July') ||
                line.includes('August') ||
                line.includes('September') ||
                line.includes('October') ||
                line.match(/\d{4}-\d{2}-\d{2}/) || // Date patterns like 2025-11-26
                line.match(/\[ip-[\d.-]+\]/i) // IP address patterns
            ) {
                continue;
            }

            // Parse student row: format is usually: ",1.,,2022310039,"ABUTON, Harold Y",..."
            const parts = line.split(',');

            // Find student number (usually a long number)
            let studentNo = '';
            let fullName = '';

            for (let j = 0; j < parts.length; j++) {
                const part = parts[j].trim().replace(/"/g, '');

                // Student number is usually 9-11 digits
                if (part.match(/^\d{9,11}$/)) {
                    studentNo = part;
                }

                // Full name usually contains comma and capital letters (last name, first name format)
                // Must start with capital letter and contain a comma
                if (part.match(/^[A-Z][A-Z\s,]+[A-Z]$/) && part.includes(',')) {
                    fullName = part;
                }
            }

            // Alternative: look for quoted names
            const quotedNameMatch = line.match(/"([^"]+)"/);
            if (quotedNameMatch && !fullName) {
                const quotedName = quotedNameMatch[1].trim();
                // Validate it looks like a name (contains comma, starts with capital, not a date/IP)
                if (
                    quotedName.includes(',') &&
                    quotedName.match(/^[A-Z]/) &&
                    !quotedName.match(/\d{4}/) && // No 4-digit years
                    !quotedName.match(/\[ip-/i) && // No IP addresses
                    quotedName.length > 5 // Reasonable name length
                ) {
                    fullName = quotedName;
                }
            }

            // Final validation: name must be valid and not contain unwanted patterns
            if (fullName && fullName.length > 3) {
                const trimmedName = fullName.trim();
                // Additional validation: skip if it contains date/IP patterns
                if (
                    !trimmedName.match(/Date Printed/i) &&
                    !trimmedName.match(/ip-/i) &&
                    !trimmedName.match(/\.compute\.internal/i) &&
                    !trimmedName.match(/\d{4}-\d{2}-\d{2}/) &&
                    trimmedName.match(/^[A-Z][A-Z\s,]+[A-Z]/) // Must look like a name
                ) {
                    students.push({
                        studentNo: studentNo || undefined,
                        fullName: trimmedName
                    });
                }
            }
        }
    }

    // If we didn't find section in the expected format, try to extract from course_year field
    if (!section && lines.some(line => line.includes('BSIT') || line.includes('BSCS'))) {
        for (const line of lines) {
            const match = line.match(/(BSIT|BSCS|BSIS|BSBA)[\s-]?(\d+[A-Z])/i);
            if (match) {
                section = match[0].replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
                break;
            }
        }
    }

    // Validate that we have essential data
    if (!courseCode || !subjectName || students.length === 0) {
        return null;
    }

    return {
        section: section || 'UNKNOWN',
        courseCode,
        subjectName,
        facultyName: facultyName || '',
        students,
        schedules,
        yearLevel: yearLevel || '',
        department: department || 'BSIT'
    };
}


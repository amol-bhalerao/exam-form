<?php

namespace App\Support;

/**
 * Code lists printed on the board exam form. Labels are translated with __().
 */
final class Codes
{
    public const CANDIDATE_TYPES = [
        'regular' => 'Regular (fresh)',
        'repeater' => 'Repeater / backlog',
        'improvement' => 'Class improvement',
        'isolated' => 'Isolated',
        'private' => 'Private (Form No. 17)',
    ];

    public const STATUSES = [
        'draft' => 'Draft',
        'submitted' => 'With institute',
        'returned' => 'Sent back for correction',
        'verified' => 'Forwarded to board',
        'board_returned' => 'Returned by board',
        'approved' => 'Approved by board',
        'rejected' => 'Rejected',
    ];

    public const CATEGORIES = [
        'OPEN' => 'Open', 'SC' => 'Scheduled Caste (SC)', 'ST' => 'Scheduled Tribe (ST)', 'VJA' => 'VJ/DT (VJ-A)',
        'NTB' => 'NT-B', 'NTC' => 'NT-C', 'NTD' => 'NT-D', 'OBC' => 'OBC', 'SBC' => 'SBC', 'SEBC' => 'SEBC', 'EWS' => 'EWS',
    ];

    public const RELIGIONS = [
        'NON_MINORITY' => 'Hindu & other non-minority', 'MUSLIM' => 'Muslim', 'CHRISTIAN' => 'Christian', 'SIKH' => 'Sikh',
        'BUDDHIST' => 'Buddhist', 'JAIN' => 'Jain', 'PARSI' => 'Parsi', 'JEWISH' => 'Jewish', 'OTHER' => 'Other',
    ];

    public const MEDIUMS = [
        'MAR' => 'Marathi', 'ENG' => 'English', 'HIN' => 'Hindi', 'URD' => 'Urdu', 'GUJ' => 'Gujarati', 'KAN' => 'Kannada',
        'SIN' => 'Sindhi', 'TEL' => 'Telugu', 'TAM' => 'Tamil', 'MAL' => 'Malayalam', 'BEN' => 'Bengali', 'PUN' => 'Punjabi',
    ];

    public const DIVYANG = [
        'NONE' => 'None', 'BLIND' => 'Blindness', 'LOW_VISION' => 'Low vision', 'DEAF' => 'Deaf / hard of hearing',
        'LOCOMOTOR' => 'Locomotor disability', 'LEARNING' => 'Specific learning disability', 'AUTISM' => 'Autism spectrum',
        'INTELLECTUAL' => 'Intellectual disability', 'CEREBRAL_PALSY' => 'Cerebral palsy', 'MULTIPLE' => 'Multiple disabilities', 'OTHER' => 'Other',
    ];

    public const GENDERS = ['MALE' => 'Male', 'FEMALE' => 'Female', 'OTHER' => 'Transgender / other'];

    public const MONTHS = ['FEB' => 'February', 'MAR' => 'March', 'APR' => 'April', 'JUN' => 'June', 'JUL' => 'July', 'AUG' => 'August', 'OCT' => 'October'];

    public const ACCOUNT_HOLDERS = ['OWN' => 'Self', 'FATHER' => 'Father', 'MOTHER' => 'Mother', 'GUARDIAN' => 'Guardian'];

    public const SUBJECT_GROUPS = ['GENERAL' => 'General', 'BIFOCAL' => 'Bifocal', 'IT' => 'Information Technology', 'VOCATIONAL' => 'Vocational (MCVC)'];

    public const DUTY_ROLES = [
        'examiner' => 'Examiner', 'moderator' => 'Moderator', 'chief_moderator' => 'Chief moderator',
        'paper_setter' => 'Paper setter', 'supervisor' => 'Supervisor', 'centre_conductor' => 'Centre conductor',
    ];

    public const APPOINTMENT_TYPES = ['PERMANENT' => 'Permanent', 'CONTRACT' => 'Contract', 'CHB' => 'Clock-hour basis'];

    public const NOTICE_CATEGORIES = [
        'notice' => 'Notice', 'circular' => 'Circular', 'news' => 'News', 'event' => 'Event', 'timetable' => 'Timetable', 'result' => 'Result',
    ];

    /** Label for a code in one of the lists above, translated. */
    public static function label(array $list, ?string $code): string
    {
        if ($code === null || $code === '') {
            return '—';
        }
        return isset($list[$code]) ? __($list[$code]) : $code;
    }

    public static function options(array $list): array
    {
        return array_map(fn ($label) => __($label), $list);
    }
}

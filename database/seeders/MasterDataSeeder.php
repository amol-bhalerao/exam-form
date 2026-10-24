<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\Institute;
use App\Models\Stream;
use App\Models\Subject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Boards, streams, subjects (2019 GR catalogue for HSC, standard SSC list) and
 * the institute lists (HSC colleges, SSC schools) for the Chh. Sambhajinagar division.
 * Safe to run again: existing rows are updated, nothing is deleted.
 */
class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $hsc = Board::updateOrCreate(['code' => 'HSC'], [
            'name' => 'Higher Secondary Certificate (Std XII)', 'name_mr' => 'उच्च माध्यमिक प्रमाणपत्र (इ. १२ वी)',
            'name_hi' => 'उच्च माध्यमिक प्रमाणपत्र (कक्षा 12)', 'short_name' => 'HSC', 'has_streams' => true, 'sort' => 1,
        ]);
        $ssc = Board::updateOrCreate(['code' => 'SSC'], [
            'name' => 'Secondary School Certificate (Std X)', 'name_mr' => 'माध्यमिक शालांत प्रमाणपत्र (इ. १० वी)',
            'name_hi' => 'माध्यमिक स्कूल प्रमाणपत्र (कक्षा 10)', 'short_name' => 'SSC', 'has_streams' => false, 'sort' => 2,
        ]);

        $streams = [];
        foreach ([
            ['SCI', 'Science', 'विज्ञान', 'विज्ञान', 'SCIENCE', 1],
            ['ART', 'Arts', 'कला', 'कला', 'ARTS', 2],
            ['COM', 'Commerce', 'वाणिज्य', 'वाणिज्य', 'COMMERCE', 3],
            ['VOC', 'HSC Vocational (MCVC)', 'एचएससी व्यावसायिक (MCVC)', 'एचएससी व्यावसायिक (MCVC)', 'VOCATIONAL', 4],
            ['TEC', 'Technology Science', 'तंत्र विज्ञान', 'तकनीकी विज्ञान', null, 5],
        ] as [$code, $en, $mr, $hi, $gr, $n]) {
            $streams[$code] = Stream::updateOrCreate(['board_id' => $hsc->id, 'code' => $code], [
                'name' => $en, 'name_mr' => $mr, 'name_hi' => $hi, 'gr_key' => $gr, 'number' => $n, 'sort' => $n,
            ]);
        }
        $sscGeneral = Stream::updateOrCreate(['board_id' => $ssc->id, 'code' => 'GEN'], [
            'name' => 'SSC (Std X)', 'name_mr' => 'एस.एस.सी. (इ. १० वी)', 'name_hi' => 'एस.एस.सी. (कक्षा 10)', 'number' => 1, 'sort' => 1,
        ]);

        $this->seedHscSubjects($hsc, $streams);
        $this->seedSscSubjects($ssc, $sscGeneral);
        $this->seedInstitutes($hsc, 'institutes_hsc.csv', $streams);
        $this->seedInstitutes($ssc, 'institutes_ssc.csv', ['GEN' => $sscGeneral], true);
    }

    private function seedHscSubjects(Board $board, array $streams): void
    {
        $gr = json_decode(file_get_contents(database_path('data/gr_scheme.json')), true);
        $byCode = [];
        foreach ($gr['catalogue'] as $i => $s) {
            $papers = match ($s['kind']) { 'BIFOCAL' => 2, 'VOCATIONAL' => 3, default => 1 };
            $byCode[$s['code']] = Subject::updateOrCreate(['board_id' => $board->id, 'code' => $s['code']], [
                'name' => $s['name']['en'], 'name_mr' => $s['name']['mr'], 'name_hi' => $s['name']['hi'], 'kind' => $s['kind'],
                'theory_marks' => $s['theory'] ?? null, 'internal_marks' => $s['internal'] ?? null, 'papers' => $papers,
                'graded' => (bool) ($s['graded'] ?? false), 'is_active' => true, 'sort' => $i + 1,
            ]);
        }

        // Board default subject list per stream = everything the GR scheme allows for it.
        foreach ($streams as $code => $stream) {
            $key = $stream->gr_key ?? 'SCIENCE';
            $scheme = $gr['scheme'][$key];
            $codes = array_merge(
                $gr['compulsory'],
                $scheme['groupAChoice'] ?? [],
                $scheme['groupB'] ?? [],
                $scheme['groupC'] ?? [],
                isset($scheme['foundation']) ? [$scheme['foundation']] : [],
                $scheme['optional'] ?? [],
            );
            $ids = collect(array_unique($codes))->map(fn ($c) => $byCode[$c]->id ?? null)->filter()->values()->all();
            $stream->subjects()->sync($ids);
        }
    }

    private function seedSscSubjects(Board $board, Stream $general): void
    {
        // Standard SSC subjects (Std X). Codes are portal codes; super admin can edit them to match board codes.
        $list = [
            ['S01', 'Marathi (first language)', 'मराठी (प्रथम भाषा)', 'मराठी (प्रथम भाषा)', 'LANGUAGE'],
            ['S02', 'Hindi (first language)', 'हिंदी (प्रथम भाषा)', 'हिंदी (प्रथम भाषा)', 'LANGUAGE'],
            ['S03', 'Urdu (first language)', 'उर्दू (प्रथम भाषा)', 'उर्दू (प्रथम भाषा)', 'LANGUAGE'],
            ['S04', 'English (first language)', 'इंग्रजी (प्रथम भाषा)', 'अंग्रेज़ी (प्रथम भाषा)', 'LANGUAGE'],
            ['S05', 'Gujarati (first language)', 'गुजराती (प्रथम भाषा)', 'गुजराती (प्रथम भाषा)', 'LANGUAGE'],
            ['S06', 'Kannada (first language)', 'कन्नड (प्रथम भाषा)', 'कन्नड़ (प्रथम भाषा)', 'LANGUAGE'],
            ['S07', 'Telugu (first language)', 'तेलुगु (प्रथम भाषा)', 'तेलुगु (प्रथम भाषा)', 'LANGUAGE'],
            ['S08', 'Sindhi (first language)', 'सिंधी (प्रथम भाषा)', 'सिंधी (प्रथम भाषा)', 'LANGUAGE'],
            ['S15', 'English (second / third language)', 'इंग्रजी (द्वितीय / तृतीय भाषा)', 'अंग्रेज़ी (द्वितीय / तृतीय भाषा)', 'LANGUAGE'],
            ['S16', 'Hindi (second / third language)', 'हिंदी (द्वितीय / तृतीय भाषा)', 'हिंदी (द्वितीय / तृतीय भाषा)', 'LANGUAGE'],
            ['S17', 'Marathi (second / third language)', 'मराठी (द्वितीय / तृतीय भाषा)', 'मराठी (द्वितीय / तृतीय भाषा)', 'LANGUAGE'],
            ['S18', 'Sanskrit', 'संस्कृत', 'संस्कृत', 'LANGUAGE'],
            ['S19', 'Hindi–Sanskrit (composite)', 'हिंदी–संस्कृत (संयुक्त)', 'हिंदी–संस्कृत (संयुक्त)', 'LANGUAGE'],
            ['S20', 'Marathi–Sanskrit (composite)', 'मराठी–संस्कृत (संयुक्त)', 'मराठी–संस्कृत (संयुक्त)', 'LANGUAGE'],
            ['S31', 'Mathematics Part I (Algebra)', 'गणित भाग १ (बीजगणित)', 'गणित भाग 1 (बीजगणित)', 'CORE'],
            ['S32', 'Mathematics Part II (Geometry)', 'गणित भाग २ (भूमिती)', 'गणित भाग 2 (ज्यामिति)', 'CORE'],
            ['S33', 'Science and Technology Part I', 'विज्ञान व तंत्रज्ञान भाग १', 'विज्ञान एवं प्रौद्योगिकी भाग 1', 'CORE'],
            ['S34', 'Science and Technology Part II', 'विज्ञान व तंत्रज्ञान भाग २', 'विज्ञान एवं प्रौद्योगिकी भाग 2', 'CORE'],
            ['S35', 'History and Political Science', 'इतिहास व राज्यशास्त्र', 'इतिहास एवं राजनीति विज्ञान', 'CORE'],
            ['S36', 'Geography', 'भूगोल', 'भूगोल', 'CORE'],
            ['S41', 'Health and Physical Education', 'आरोग्य व शारीरिक शिक्षण', 'स्वास्थ्य एवं शारीरिक शिक्षा', 'COMPULSORY'],
            ['S42', 'Water Security', 'जलसुरक्षा', 'जल सुरक्षा', 'COMPULSORY'],
            ['S43', 'Defence Studies / Scouts and Guides', 'संरक्षणशास्त्र / स्काउट गाइड', 'रक्षा अध्ययन / स्काउट गाइड', 'ELECTIVE'],
            ['S51', 'Information and Communication Technology', 'माहिती व संप्रेषण तंत्रज्ञान', 'सूचना एवं संचार प्रौद्योगिकी', 'ELECTIVE'],
            ['S52', 'Vocational subject (NSQF)', 'व्यावसायिक विषय (NSQF)', 'व्यावसायिक विषय (NSQF)', 'VOCATIONAL'],
        ];
        $ids = [];
        foreach ($list as $i => [$code, $en, $mr, $hi, $kind]) {
            $ids[] = Subject::updateOrCreate(['board_id' => $board->id, 'code' => $code], [
                'name' => $en, 'name_mr' => $mr, 'name_hi' => $hi, 'kind' => $kind, 'papers' => 1,
                'graded' => in_array($code, ['S41', 'S42', 'S43'], true), 'is_active' => true, 'sort' => $i + 1,
            ])->id;
        }
        $general->subjects()->sync($ids);
    }

    private function seedInstitutes(Board $board, string $file, array $streams, bool $allStreams = false): void
    {
        $fh = fopen(database_path('data/' . $file), 'r');
        $header = fgetcsv($fh);
        $limit = (int) env('SEED_INSTITUTE_LIMIT', 0); // tests seed only a few
        DB::transaction(function () use ($fh, $header, $board, $streams, $allStreams, $limit) {
            $n = 0;
            while (($row = fgetcsv($fh)) !== false) {
                if ($limit && $n++ >= $limit) {
                    break;
                }
                $r = array_combine($header, $row);
                $institute = Institute::updateOrCreate(
                    ['board_id' => $board->id, 'college_no' => trim($r['college_no'])],
                    ['udise_no' => trim($r['udise_no']) ?: null, 'name' => trim($r['name']), 'district' => $r['district'] ?: null]
                );
                $codes = $allStreams ? array_keys($streams) : array_filter(explode('|', $r['streams'] ?? ''));
                $institute->streams()->syncWithoutDetaching(
                    collect($codes)->map(fn ($c) => $streams[$c]->id ?? null)->filter()->all()
                );
            }
        });
        fclose($fh);
    }
}

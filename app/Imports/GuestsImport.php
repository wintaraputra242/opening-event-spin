<?php

namespace App\Imports;

use App\Models\Guest;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\SkipsFailures;

class GuestsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnError, SkipsOnFailure
{
    use SkipsErrors, SkipsFailures;

    public function model(array $row)
    {
        if (!empty($row['code']) && Guest::where('code', strtoupper($row['code']))->exists()) {
            return null;
        }

        return new Guest([
            'name'       => $row['nama']       ?? null,
            'phone'      => $row['telepon']    ?? null,
            'office'     => $row['perusahaan'] ?? null,
            'code'       => !empty($row['code']) ? strtoupper($row['code']) : null,
            'is_present' => false,
        ]);
    }

    public function rules(): array
    {
        return [
            'nama'       => 'required|string',
            'telepon'    => 'required|string',
            'perusahaan' => 'required|string',
        ];
    }
}

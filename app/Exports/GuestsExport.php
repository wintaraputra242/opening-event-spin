<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Illuminate\Support\Collection;

class GuestsExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return new Collection([
            ['Nama Contoh', '081123123123', 'PT. Contoh'],
        ]);
    }

    public function headings(): array
    {
        return ['nama', 'telepon', 'perusahaan'];
    }
}
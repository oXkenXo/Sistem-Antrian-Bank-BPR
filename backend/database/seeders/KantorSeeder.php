<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Kantor;

class KantorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $branches = [
            ['id_kantor' => '01', 'nama_kantor' => 'Kantor Pusat (Soreang)', 'alamat' => 'Jl. Raya Soreang No. 12, Soreang', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/02.jpg'],
            ['id_kantor' => '02', 'nama_kantor' => 'Kantor Cabang Banjaran', 'alamat' => 'Jl. Raya Banjaran No. 45, Banjaran', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/03.jpg'],
            ['id_kantor' => '03', 'nama_kantor' => 'Kantor Cabang Ciparay', 'alamat' => 'Jl. Raya Ciparay No. 88, Ciparay', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '04', 'nama_kantor' => 'Kantor Cabang Majalaya', 'alamat' => 'Jl. Raya Majalaya No. 101, Majalaya', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '05', 'nama_kantor' => 'Kantor Cabang Rancaekek', 'alamat' => 'Jl. Raya Rancaekek No. 54, Rancaekek', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '06', 'nama_kantor' => 'Kantor Cabang Cicalengka', 'alamat' => 'Jl. Raya Cicalengka No. 120, Cicalengka', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '07', 'nama_kantor' => 'Kantor Cabang Baleendah', 'alamat' => 'Jl. Raya Baleendah No. 210, Baleendah', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '08', 'nama_kantor' => 'Kantor Cabang Pangalengan', 'alamat' => 'Jl. Raya Pangalengan No. 34, Pangalengan', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '09', 'nama_kantor' => 'Kantor Cabang Ciwidey', 'alamat' => 'Jl. Raya Ciwidey No. 77, Ciwidey', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '10', 'nama_kantor' => 'Kantor Cabang Margahayu', 'alamat' => 'Jl. Raya Kopo Sayati No. 15, Margahayu', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '11', 'nama_kantor' => 'Kantor Cabang Dayeuhkolot', 'alamat' => 'Jl. Raya Dayeuhkolot No. 143, Dayeuhkolot', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '12', 'nama_kantor' => 'Kantor Cabang Katapang', 'alamat' => 'Jl. Raya Katapang No. 99, Katapang', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '13', 'nama_kantor' => 'Kantor Cabang Cileunyi', 'alamat' => 'Jl. Raya Cileunyi No. 202, Cileunyi', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '14', 'nama_kantor' => 'Kantor Cabang Bojongsoang', 'alamat' => 'Jl. Raya Bojongsoang No. 66, Bojongsoang', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '15', 'nama_kantor' => 'Kantor Cabang Pacet', 'alamat' => 'Jl. Raya Pacet No. 12, Pacet', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
            ['id_kantor' => '16', 'nama_kantor' => 'Kantor Cabang Cimaung', 'alamat' => 'Jl. Raya Cimaung No. 40, Cimaung', 'gambar_kantor' => 'https://bankkertaraharja.co.id/assets/img/kantor_cabang/blank.jpg'],
        ];

        foreach ($branches as $branch) {
            Kantor::updateOrCreate(['id_kantor' => $branch['id_kantor']], $branch);
        }
    }
}

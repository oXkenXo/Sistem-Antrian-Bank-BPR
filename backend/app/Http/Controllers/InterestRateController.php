<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class InterestRateController extends Controller
{
    /**
     * Fetch BI Rate (Bank Indonesia 7-Day Reverse Repo Rate) from FRED API.
     * FRED Series ID: IRSTCB01IDM156N = Central Bank Policy Rate: Indonesia (Monthly)
     * 
     * Free API Key: Get yours at https://fredaccount.stlouisfed.org/apikey
     */
    public function getRate()
    {
        // Cache the rate for 6 hours (BI Rate barely changes intra-day)
        $data = Cache::remember('bi_rate', 60 * 60 * 6, function () {
            $apiKey = config('services.fred.api_key', env('FRED_API_KEY', ''));

            if (empty($apiKey)) {
                // Return fallback data if no API key is configured yet
                return $this->getFallbackData();
            }

            try {
                $response = Http::timeout(10)->get('https://api.stlouisfed.org/fred/series/observations', [
                    'series_id'     => 'IRSTCB01IDM156N',
                    'api_key'       => $apiKey,
                    'file_type'     => 'json',
                    'sort_order'    => 'desc',
                    'limit'         => 3,
                    'observation_start' => '2024-01-01',
                ]);

                if (!$response->successful()) {
                    return $this->getFallbackData();
                }

                $json = $response->json();
                $observations = $json['observations'] ?? [];

                if (empty($observations)) {
                    return $this->getFallbackData();
                }

                // Latest non-null value
                $latestObs = null;
                foreach ($observations as $obs) {
                    if ($obs['value'] !== '.' && !empty($obs['value'])) {
                        $latestObs = $obs;
                        break;
                    }
                }

                if (!$latestObs) {
                    return $this->getFallbackData();
                }

                $rate = floatval($latestObs['value']);
                $dateFormatted = \Carbon\Carbon::parse($latestObs['date'])->locale('id')->translatedFormat('F Y');

                return [
                    'bi_rate'       => $rate,
                    'bi_rate_str'   => number_format($rate, 2, ',', '.') . '%',
                    'period'        => $dateFormatted,
                    'source'        => 'FRED / Bank Indonesia',
                    'last_updated'  => now()->toDateTimeString(),
                ];
            } catch (\Exception $e) {
                return $this->getFallbackData();
            }
        });

        return response()->json($data);
    }

    /**
     * Hardcoded fallback: BI Rate per Agustus 2024 = 6.25%
     * Update this when BI Rate changes officially.
     */
    private function getFallbackData(): array
    {
        return [
            'bi_rate'      => 5.75,
            'bi_rate_str'  => '5,75%',
            'period'       => 'Januari 2025',
            'source'       => 'Bank Indonesia (Fallback)',
            'last_updated' => now()->toDateTimeString(),
        ];
    }
}

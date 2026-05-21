// Selalu segar dari env — jangan di-cache statik.
export const dynamic = "force-dynamic";

/**
 * GET /.well-known/assetlinks.json
 * Digital Asset Links untuk TWA (Trusted Web Activity) → menghilangkan address bar
 * pada APK Android. SHA-256 fingerprint diisi via env saat build APK.
 */
export async function GET() {
  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: process.env.TWA_PACKAGE_NAME ?? "com.blitarmengaji.twa",
        sha256_cert_fingerprints: (process.env.TWA_SHA256 ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    },
  ];

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

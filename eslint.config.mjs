// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import next from "@next/eslint-plugin-next";

/**
 * Lint kapısı.
 *
 * NEDEN EKLENDİ
 * Projede hiç ESLint yapılandırması yoktu. Derleyiciye sıkı bayrakla
 * sorulduğunda 141 ölü kod bulgusu (kullanılmayan import, değişken,
 * parametre) birikmişti. Temizlendi — ama hiçbir şey yenisinin birikmesini
 * engellemiyordu. Bu dosya o kapıyı kuruyor.
 *
 * KURAL SEÇİMİ
 * Kural listesi kasıtlı olarak dar: gürültü üreten stil kuralları yok,
 * yalnızca GERÇEK hata sınıflarını yakalayanlar var. Geniş bir kural
 * setiyle başlayıp yüzlerce uyarı üretmek, ekibin lint çıktısını okumayı
 * bırakmasına yol açar — o noktadan sonra kapı yoktur.
 *
 * Tip bilgisi gerektiren kurallar (`no-floating-promises` gibi) açık:
 * bu projede `await` unutulan bir `audit()` ya da `publish()` çağrısı
 * sessiz veri kaybı demek.
 */
export default tseslint.config(
  {
    // Üretilmiş ve dış kaynaklı dosyalar denetlenmez.
    ignores: [
      ".next/**", "node_modules/**", "drizzle/**", "public/**",
      "next-env.d.ts", ".data/**",
      // Bagimsiz Node mikroservisi (CommonJS, kendi package.json'u); Next kurallarina tabi degil.
      "services/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": next,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...next.configs.recommended.rules,

      /* --- Ölü kod: bu kapının asıl sebebi --- */
      "@typescript-eslint/no-unused-vars": ["error", {
        // "_" ile başlayanlar bilerek kullanılmayan parametrelerdir
        // (imza gereği durur, örn. `(_req, ctx) => ...`).
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        // Sondaki kullanılmayan parametreler hata; aradakiler imzanın parçası.
        args: "after-used",
      }],

      /* --- Sessiz veri kaybı --- */
      // `await` unutulan bir yazma işlemi hata fırlatmadan kaybolur.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": ["error", {
        // onClick={async () => ...} yaygın ve güvenli bir kalıp.
        checksVoidReturn: { attributes: false },
      }],

      /*
        --- Kasıtlı olarak GEVŞETİLENLER ---
        Aşağıdakiler bu kod tabanında yüzlerce uyarı üretir ve hiçbiri
        gerçek bir hatayı göstermez. Hata olarak bırakmak lint çıktısını
        okunmaz hale getirirdi.
      */
      // Drizzle'ın sql`` şablonları ve dinamik JSON alanları `any` üretir.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // `${sayı}` şablon içinde gayet okunaklı.
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/require-await": "off",
    },
  },

  {
    /*
      Yapılandırma ve yardımcı .mjs dosyaları tsconfig kapsamında değil;
      tip-farkındalı kurallar bunları ayrıştıramaz. Tip gerektirmeyen
      kurallarla denetlenirler.
    */
    files: ["**/*.mjs", "**/*.js"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      // `disableTypeChecked` yalnizca KURALLARI kapatir; ayristirici yine
      // tsconfig projesini arar ve bu dosyalar kapsamda olmadigi icin
      // "not found by the project service" hatasi verir. Proje servisini
      // burada acikca kapatiyoruz.
      parserOptions: { projectService: false, project: false },
      // Node betikleri: `globals` paketi eklemeye degmeyecek kadar az global.
      globals: { process: "readonly", console: "readonly", __dirname: "readonly" },
    },
  },

  {
    // Betikler ve testler: tip-farkındalı kurallar burada gürültü yapar.
    files: ["scripts/**/*.ts", "tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "no-console": "off",
    },
  },
);

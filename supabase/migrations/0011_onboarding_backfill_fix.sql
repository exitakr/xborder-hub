-- 0011_onboarding_backfill_fix.sql
--
-- 0010 のバックフィルは display_name を email ローカル部と完全一致でだけ
-- マッチさせていたため、"Exitakr" や "Akira " のように大文字化/前後空白が
-- 入った行を取りこぼしていた。これを case-insensitive + trim 比較に直し、
-- メアドの local-part 由来であることが明らかな表示名を NULL に戻して
-- /welcome へ再誘導する。
--
-- 既にユーザーが意図して付け直した名前(メアド由来ではないもの)には影響しない。
-- 冪等: 何度実行しても安全(対象が無ければ 0 件 update)。

update public.profiles p
set display_name = null,
    onboarded_at = null
from auth.users u
where p.id = u.id
  and p.display_name is not null
  and lower(btrim(p.display_name)) = lower(split_part(u.email, '@', 1));

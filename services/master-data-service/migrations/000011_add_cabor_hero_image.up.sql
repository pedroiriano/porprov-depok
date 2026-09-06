-- INFO: Hero image Cabor bersifat opsional dan hanya menyimpan URL Media Library.
ALTER TABLE cabors ADD COLUMN hero_image_url VARCHAR(2048);

ALTER TABLE cabors ADD CONSTRAINT cabors_hero_image_url_check
    CHECK (
        hero_image_url IS NULL
        OR (
            hero_image_url LIKE '/uploads/%'
            AND hero_image_url NOT LIKE '%..%'
            AND hero_image_url NOT LIKE E'%\\%'
        )
    );

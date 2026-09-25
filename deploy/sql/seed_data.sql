-- =============================================================================
-- GuestScreen Control Center - Test & Seed Data
-- =============================================================================

-- 1. System Settings
INSERT INTO public.system_settings (
    id, worker_concurrency, max_concurrent_per_branch,
    ssh_connect_timeout_seconds, ssh_command_timeout_seconds,
    sftp_timeout_seconds, minio_media_retention_days,
    cashier_backup_retention_days, updated_at
) VALUES (
    1, 15, 2, 10, 45, 60, 30, 7, NOW()
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 2. Users (Password: Admin@GS2026!)
INSERT INTO public.users (id, username, password_hash, full_name, role, is_active, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'admin', '$argon2id$v=19$m=65536,t=3,p=4$E0IIQQgBIORcK8XYe6/VWg$0LwRFINmo5Wce4/jFtpZbfAjjHxhywv1EFGJG4jOXHY', 'Bosh Administrator', 'ADMINISTRATOR', true, NOW()),
    ('a0000000-0000-0000-0000-000000000002', 'supervisor', '$argon2id$v=19$m=65536,t=3,p=4$E0IIQQgBIORcK8XYe6/VWg$0LwRFINmo5Wce4/jFtpZbfAjjHxhywv1EFGJG4jOXHY', 'Katta Nazoratchi', 'SUPERVISOR', true, NOW()),
    ('a0000000-0000-0000-0000-000000000003', 'operator', '$argon2id$v=19$m=65536,t=3,p=4$E0IIQQgBIORcK8XYe6/VWg$0LwRFINmo5Wce4/jFtpZbfAjjHxhywv1EFGJG4jOXHY', 'Kassa Operatori', 'OPERATOR', true, NOW())
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 3. Regions
INSERT INTO public.regions (id, name, code, created_at, updated_at)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'Toshkent shahri', 'TAS', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000002', 'Toshkent viloyati', 'TVL', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000003', 'Samarqand viloyati', 'SAM', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000004', 'Farg''ona vodiysi', 'FRG', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Branches
INSERT INTO public.branches (id, region_id, name, code, address, created_at, updated_at)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Chilonzor-19', 'CHIL-19', 'Toshkent sh., Chilonzor 19-mavze', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Yunusobod-Mega', 'YUN-MEGA', 'Toshkent sh., Yunusobod Mega Planet', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Buyuk Ipak Yo''li', 'BIY-01', 'Toshkent sh., Mirzo Ulug''bek shoh ko''chasi', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Samarqand Registon', 'SAM-REG', 'Samarqand sh., Registon ko''chasi 45', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Farg''ona Markaz', 'FRG-CTR', 'Farg''ona sh., Al-Farg''oniy 12', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. SSH Credentials
INSERT INTO public.ssh_credentials (id, name, auth_type, username, key_fingerprint, created_at)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'Default Pos Terminal Key', 'CORPORATE_KEY', 'Administrator', 'SHA256:gs-pos-default-key-fingerprint', NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Cashiers (Fleet Devices)
INSERT INTO public.cashiers (
    id, branch_id, name, ip_address, ssh_port, ssh_credential_id, enabled,
    current_content_version, last_seen_at, last_sync_status, guest_screen_version,
    created_at, updated_at
) VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Chilonzor Kassa 1', '10.0.0.101', 22, 'd0000000-0000-0000-0000-000000000001', true, 'v65.0', NOW(), 'SYNCED', 'v2.4.1', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Chilonzor Kassa 2', '10.0.0.102', 22, 'd0000000-0000-0000-0000-000000000001', true, 'v65.0', NOW(), 'SYNCED', 'v2.4.1', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Yunusobod Kassa 1', '10.0.0.111', 22, 'd0000000-0000-0000-0000-000000000001', true, 'v64.8', NOW(), 'SYNCED', 'v2.4.0', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'Yunusobod Kassa 2 (Drive-thru)', '10.0.0.112', 22, 'd0000000-0000-0000-0000-000000000001', true, 'v65.0', NOW(), 'SYNCED', 'v2.4.1', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'BIY Kassa 1', '10.0.0.121', 22, 'd0000000-0000-0000-0000-000000000001', true, 'v65.0', NOW(), 'SYNCED', 'v2.4.1', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'Samarqand Kassa 1', '10.0.0.131', 22, 'd0000000-0000-0000-0000-000000000001', true, 'v63.0', NOW() - INTERVAL '2 hours', 'OUT_OF_SYNC', 'v2.3.9', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000005', 'Farg''ona Kassa 1', '10.0.0.141', 22, 'd0000000-0000-0000-0000-000000000001', false, 'v62.0', NOW() - INTERVAL '1 day', 'OFFLINE', 'v2.3.8', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Advertising Blocks
INSERT INTO public.advertising_blocks (
    id, name, description, area, display_mode, is_active,
    created_by_user_id, created_at, updated_at, version
) VALUES 
    ('f0000000-0000-0000-0000-000000000001', 'Kuzgi Maxsus Aksiya', 'Lavash va Coca-Cola aksiyasi', 'IDLE', 'FULL_SCREEN', true, 'a0000000-0000-0000-0000-000000000001', NOW(), NOW(), 1),
    ('f0000000-0000-0000-0000-000000000002', 'Buyurtma paytidagi takliflar', 'Kassa chek ekrani yonidagi reklama slayderi', 'ORDER_PROMO', 'SPLIT_32', true, 'a0000000-0000-0000-0000-000000000001', NOW(), NOW(), 1)
ON CONFLICT (id) DO NOTHING;

-- 8. Media Assets (Hex UUIDs: 0a000000-...)
INSERT INTO public.media_assets (
    id, original_name, stored_name, sha256, mime_type, media_type,
    file_size_bytes, width, height, s3_bucket, s3_key, uploaded_by_user_id, is_deleted, created_at, version
) VALUES 
    ('0a000000-0000-0000-0000-000000000001', 'lavash_combo_banner.jpg', '001.jpg', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'image/jpeg', 'IMAGE', 1048576, 1920, 1080, 'media', 'banners/001.jpg', 'a0000000-0000-0000-0000-000000000001', false, NOW(), 1),
    ('0a000000-0000-0000-0000-000000000002', 'burger_special_99k.png', '99K-Full.png', 'd41d8cd98f00b204e9800998ecf8427e', 'image/png', 'IMAGE', 2097152, 1920, 1080, 'media', 'banners/99K-Full.png', 'a0000000-0000-0000-0000-000000000001', false, NOW(), 1),
    ('0a000000-0000-0000-0000-000000000003', 'dessert_promo.jpg', 'p5.jpg', '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', 'image/jpeg', 'IMAGE', 524288, 1080, 1920, 'media', 'banners/p5.jpg', 'a0000000-0000-0000-0000-000000000001', false, NOW(), 1)
ON CONFLICT (id) DO NOTHING;

-- 9. Playlist Items (Hex UUIDs: 0b000000-...)
INSERT INTO public.playlist_items (
    id, advertising_block_id, media_asset_id, order_index, duration_seconds, created_at
) VALUES 
    ('0b000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '0a000000-0000-0000-0000-000000000001', 0, 10, NOW()),
    ('0b000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', '0a000000-0000-0000-0000-000000000002', 1, 8, NOW()),
    ('0b000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', '0a000000-0000-0000-0000-000000000003', 0, 6, NOW())
ON CONFLICT (id) DO NOTHING;

-- 10. Audit Log Sample (Matches schema columns: entity_type, entity_id, payload_diff, timestamp)
INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, payload_diff, ip_address, "timestamp"
) VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'SYSTEM_INITIALIZE', 'DATABASE', '00000000-0000-0000-0000-000000000000', '{"info": "Database schema and seed initialized"}', '127.0.0.1', NOW());

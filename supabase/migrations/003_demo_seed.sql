-- Optional demo data (run after 001 + 002). Idempotent on slug lon-demo.

INSERT INTO organization (id, name, slug, vertical, gstin, settings)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Lon Demo Salon',
  'lon-demo',
  'SALON',
  '29AAKCL4821M1Z6',
  '{"features":{}}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO branch (id, org_id, name, area, pricing_factor)
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Indiranagar', '100 Feet Road', 1),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Koramangala', '5th Block', 0.86),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'HSR Layout', 'Sector 2', 0.72),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Whitefield', 'ITPL Main Road', 0.94),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Jayanagar', '4th Block', 0.64)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profile (id, full_name, email)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'Priya Sharma', 'priya@demo.lon'),
  ('c0000000-0000-4000-8000-000000000002', 'Arjun Reddy', 'arjun@demo.lon'),
  ('c0000000-0000-4000-8000-000000000003', 'Kavya Nair', 'kavya@demo.lon'),
  ('c0000000-0000-4000-8000-000000000004', 'Rohan Gowda', 'rohan@demo.lon'),
  ('c0000000-0000-4000-8000-000000000005', 'Meera Iyer', 'meera@demo.lon'),
  ('c0000000-0000-4000-8000-000000000006', 'Sameer Khan', 'sameer@demo.lon')
ON CONFLICT (id) DO NOTHING;

INSERT INTO org_member (id, org_id, profile_id, role, job_title, display_color, stats)
VALUES
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'TEAM', 'Senior Stylist', '#3598CB', '{"revenue":184200,"services":142,"rating":4.9,"attendance":"present","shift":"10:00–19:00","payroll_base":42000}'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'TEAM', 'Colour Specialist', '#D13095', '{"revenue":162500,"services":96,"rating":4.8,"attendance":"present","shift":"11:00–20:00","payroll_base":38000}'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'TEAM', 'Bridal Makeup Artist', '#7B5CFF', '{"revenue":221000,"services":41,"rating":4.9,"attendance":"present","shift":"09:00–18:00","payroll_base":45000}'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004', 'TEAM', 'Master Barber', '#F07B3F', '{"revenue":98400,"services":211,"rating":4.7,"attendance":"present","shift":"09:00–19:00","payroll_base":28000}'),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000005', 'TEAM', 'Skin Therapist', '#12A594', '{"revenue":121300,"services":88,"rating":4.8,"attendance":"late","shift":"10:00–19:00","payroll_base":32000}'),
  ('d0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000006', 'TEAM', 'Stylist', '#D99A00', '{"revenue":87600,"services":124,"rating":4.6,"attendance":"present","shift":"12:00–21:00","payroll_base":26000}')
ON CONFLICT (org_id, profile_id) DO NOTHING;

INSERT INTO catalog_item (org_id, item_type, name, category, price, duration_hours)
SELECT 'a0000000-0000-4000-8000-000000000001', 'SERVICE', v.name, v.category, v.price, v.dur
FROM (VALUES
  ('Haircut — Men', 'Hair', 450, 0.5),
  ('Haircut — Women', 'Hair', 850, 0.75),
  ('Hair Colour — Global', 'Hair', 2800, 1.5),
  ('Hair Spa', 'Hair', 1500, 1),
  ('O3+ Facial', 'Skin', 1800, 1),
  ('Bridal Makeup', 'Makeup', 18000, 3),
  ('Gel Manicure', 'Nails', 700, 0.75),
  ('Beard Trim & Style', 'Grooming', 250, 0.5)
) AS v(name, category, price, dur)
WHERE NOT EXISTS (
  SELECT 1 FROM catalog_item c WHERE c.org_id = 'a0000000-0000-4000-8000-000000000001' AND c.name = v.name
);

INSERT INTO catalog_item (org_id, item_type, name, category, sku, stock, min_stock, cost, supplier, unit, price)
SELECT 'a0000000-0000-4000-8000-000000000001', 'PRODUCT', v.*
FROM (VALUES
  ('L''Oreal Majirel 6.0 Dark Blonde', 'Hair Colour', 'LOR-MAJ-060', 4, 12, 520, 'L''Oreal Professionnel', NULL::text, NULL::int),
  ('Kerastase Bain Satin Shampoo', 'Retail', 'KER-BS-250', 22, 8, 1650, 'L''Oreal Luxe', '250 ml', 2650),
  ('Olaplex No.3 Hair Perfector', 'Retail', 'OLA-N3-100', 3, 6, 1900, 'Nykaa Pro', '100 ml', 2900),
  ('Matrix Opti.Care Keratin Cream', 'Treatment', 'MAT-OPC-KER', 2, 5, 2100, 'L''Oreal Professionnel', NULL::text, NULL::int)
) AS v(name, category, sku, stock, min_stock, cost, supplier, unit, price)
WHERE NOT EXISTS (
  SELECT 1 FROM catalog_item c WHERE c.org_id = 'a0000000-0000-4000-8000-000000000001' AND c.sku = v.sku
);

INSERT INTO customer (org_id, branch_id, full_name, phone, email, tier, visit_count, lifetime_spend, last_visit_at, favourite_item)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Ananya Rao', '+919845012345', 'ananya.rao@gmail.com', 'Gold', 18, 42500, now() - interval '12 days', 'Hair Spa'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'Rahul Menon', '+919901288776', 'rahul.menon@gmail.com', 'Silver', 8, 12400, now() - interval '45 days', 'Haircut — Men'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Sneha Kulkarni', '+918765432109', 'sneha.kulkarni@gmail.com', 'Platinum', 24, 68200, now() - interval '3 days', 'Hair Colour — Global'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004', 'Vikram Shetty', '+919121487212', 'vikram.shetty@gmail.com', 'New', 4, 5200, now() - interval '78 days', 'Beard Trim & Style'),
  ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'Pooja Hegde', '+919988766554', 'pooja.hegde@gmail.com', 'Gold', 11, 28900, now() - interval '21 days', 'O3+ Facial')
ON CONFLICT (org_id, phone) DO NOTHING;

INSERT INTO campaign (org_id, channel, audience, status, reach, sent_label)
SELECT 'a0000000-0000-4000-8000-000000000001', v.*
FROM (VALUES
  ('WhatsApp', 'Lapsed regulars (60+ days)', 'DRAFT', 642, '—'),
  ('WhatsApp', 'Platinum tier', 'SENT', 128, '2 days ago'),
  ('SMS', 'Birthdays this week', 'SCHEDULED', 34, 'Tomorrow 10:00')
) AS v(channel, audience, status, reach, sent_label)
WHERE NOT EXISTS (SELECT 1 FROM campaign WHERE org_id = 'a0000000-0000-4000-8000-000000000001' LIMIT 1);

INSERT INTO appointment (org_id, branch_id, staff_member_id, customer_name, service_name, starts_at, duration_hours, status, price)
SELECT
  'a0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  v.staff_id,
  v.cust,
  v.svc,
  date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') + (v.start_h * interval '1 hour') AT TIME ZONE 'Asia/Kolkata',
  v.dur,
  v.st::appointment_status,
  v.price
FROM (VALUES
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'Divya Menon', 'Haircut — Women', 14.5, 0.75, 'IN_PROGRESS', 850),
  ('d0000000-0000-4000-8000-000000000002', 'Ritika Agarwal', 'Hair Colour — Global', 13, 1.5, 'IN_PROGRESS', 2800),
  ('d0000000-0000-4000-8000-000000000004', 'Aditya Gupta', 'Haircut — Men', 13.5, 0.5, 'IN_PROGRESS', 450),
  ('d0000000-0000-4000-8000-000000000001', 'Tanvi Shetty', 'Haircut — Women', 19, 0.75, 'PENDING', 850),
  ('d0000000-0000-4000-8000-000000000003', 'Shreya Desai', 'Party Makeup', 15, 1.5, 'CONFIRMED', 4500)
) AS v(staff_id, cust, svc, start_h, dur, st, price)
WHERE NOT EXISTS (
  SELECT 1 FROM appointment WHERE org_id = 'a0000000-0000-4000-8000-000000000001' LIMIT 1
);
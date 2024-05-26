INSERT INTO carts (id, user_id, status)
VALUES
    ('c064bd24-ef0c-443e-ab0b-3925c46f555b', '5bec1981-b09f-43ef-b099-726b67d4e556', 'OPEN');

INSERT INTO cart_items (cart_id, product_id, count)
VALUES
    ('c064bd24-ef0c-443e-ab0b-3925c46f555b', 'f4503e8a-4dcf-4285-8b82-f86f64ef306d', 1),
    ('c064bd24-ef0c-443e-ab0b-3925c46f555b', '6326014a-8c89-41d2-8f49-b110692f9795', 10);
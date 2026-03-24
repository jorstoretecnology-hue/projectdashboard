SELECT 'inventory_items' AS tabla, COUNT(*) AS huerfanos FROM inventory_items ii LEFT JOIN products p ON p.id = ii.product_id WHERE p.id IS NULL AND ii.product_id IS NOT NULL
UNION ALL
SELECT 'inventory_movements', COUNT(*) FROM inventory_movements im LEFT JOIN products p ON p.id = im.product_id WHERE p.id IS NULL AND im.product_id IS NOT NULL
UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items si LEFT JOIN products p ON p.id = si.product_id WHERE p.id IS NULL AND si.product_id IS NOT NULL
UNION ALL
SELECT 'sales', COUNT(*) FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE c.id IS NULL AND s.customer_id IS NOT NULL;

DELETE FROM access_permissions WHERE code IN (
    'venue.view', 'venue.create', 'venue.update',
    'venue.archive', 'venue.restore', 'venue.manage'
);

-- Update regional factors based on purchasing power and cost of living
-- Higher purchasing power regions = higher factors (can charge more)
-- Lower purchasing power regions = lower factors (should charge less)

UPDATE regional_factors SET factor = 1.1500 WHERE state_code = 'SP'; -- São Paulo (highest)
UPDATE regional_factors SET factor = 1.1200 WHERE state_code = 'RJ'; -- Rio de Janeiro
UPDATE regional_factors SET factor = 1.1300 WHERE state_code = 'DF'; -- Distrito Federal
UPDATE regional_factors SET factor = 1.0500 WHERE state_code = 'PR'; -- Paraná
UPDATE regional_factors SET factor = 1.0600 WHERE state_code = 'SC'; -- Santa Catarina
UPDATE regional_factors SET factor = 1.0400 WHERE state_code = 'RS'; -- Rio Grande do Sul
UPDATE regional_factors SET factor = 1.0300 WHERE state_code = 'MG'; -- Minas Gerais
UPDATE regional_factors SET factor = 1.0200 WHERE state_code = 'ES'; -- Espírito Santo
UPDATE regional_factors SET factor = 1.0100 WHERE state_code = 'GO'; -- Goiás
UPDATE regional_factors SET factor = 1.0000 WHERE state_code = 'MT'; -- Mato Grosso
UPDATE regional_factors SET factor = 1.0000 WHERE state_code = 'MS'; -- Mato Grosso do Sul

-- Northeast region (lower purchasing power)
UPDATE regional_factors SET factor = 0.9200 WHERE state_code = 'BA'; -- Bahia
UPDATE regional_factors SET factor = 0.9000 WHERE state_code = 'PE'; -- Pernambuco
UPDATE regional_factors SET factor = 0.8800 WHERE state_code = 'CE'; -- Ceará
UPDATE regional_factors SET factor = 0.8500 WHERE state_code = 'MA'; -- Maranhão
UPDATE regional_factors SET factor = 0.8700 WHERE state_code = 'PB'; -- Paraíba
UPDATE regional_factors SET factor = 0.8600 WHERE state_code = 'RN'; -- Rio Grande do Norte
UPDATE regional_factors SET factor = 0.8500 WHERE state_code = 'PI'; -- Piauí
UPDATE regional_factors SET factor = 0.8800 WHERE state_code = 'AL'; -- Alagoas
UPDATE regional_factors SET factor = 0.8700 WHERE state_code = 'SE'; -- Sergipe

-- North region (lower purchasing power)
UPDATE regional_factors SET factor = 0.9000 WHERE state_code = 'PA'; -- Pará
UPDATE regional_factors SET factor = 0.8800 WHERE state_code = 'AM'; -- Amazonas
UPDATE regional_factors SET factor = 0.8500 WHERE state_code = 'RO'; -- Rondônia
UPDATE regional_factors SET factor = 0.8700 WHERE state_code = 'AC'; -- Acre
UPDATE regional_factors SET factor = 0.8600 WHERE state_code = 'TO'; -- Tocantins
UPDATE regional_factors SET factor = 0.8400 WHERE state_code = 'RR'; -- Roraima
UPDATE regional_factors SET factor = 0.8400 WHERE state_code = 'AP'; -- Amapá
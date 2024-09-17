// Pricing Variables
const VAT_RATE = 21; // VAT percentage
const GLOBAL_FACTOR = 1.12; // Global pricing factor (from data-global-factor)
const LOCAL_FACTOR = 0.95; // Local pricing factor (from data-local-factor)
const BASE_SURCHARGE = 0.27; // Base surcharge per unit
const QUANTITY_SURCHARGE = 65; // Additional surcharge divided by quantity
const ADDITIONAL_FACTOR = 1.05; // Additional pricing factor

// Profit margins based on quantity
const PROFIT_MARGIN_SMALL = 0.64; // For quantity < 51
const PROFIT_MARGIN_MEDIUM = 0.64; // For quantity 51-250
const PROFIT_MARGIN_LARGE = 0.65; // For quantity > 250

// Surface factors based on total surface area
const SURFACE_FACTORS = [
    { maxSurface: 200, factor: 0.18 },
    { maxSurface: 500, factor: 0.08 },
    { maxSurface: 3000, factor: 0.02 },
    { maxSurface: Infinity, factor: 0 }
];

// Dimension thresholds
const LENGTH_THRESHOLD_1 = 0.900;
const LENGTH_THRESHOLD_2 = 1.249;
const LENGTH_THRESHOLD_3 = 1.499;
const WIDTH_HEIGHT_THRESHOLD_1 = 0.2;
const HEIGHT_THRESHOLD_1 = 0.499;
const HEIGHT_THRESHOLD_2 = 0.900;
const HEIGHT_THRESHOLD_3 = 1.249;
const HEIGHT_THRESHOLD_4 = 1.499;

// Quantity thresholds
const QUANTITY_THRESHOLD_1 = 51;
const QUANTITY_THRESHOLD_2 = 251;

// Content thresholds
const CONTENT_THRESHOLD_1 = 0.099;
const CONTENT_THRESHOLD_2 = 0.249;
const CONTENT_THRESHOLD_3 = 0.499;

// Circumference thresholds
const CIRCUMFERENCE_THRESHOLD_1 = 2.40;
const CIRCUMFERENCE_THRESHOLD_2 = 0.50;

function calcformCalculate() {
    const calcForm = document.getElementById('wbc-calcform');

    var Mat = document.getElementById('field-box-kwaliteit');
    var Col = document.getElementById('field-box-kleur');
    const length = parseLocaleFloat(document.getElementById('field-box-lengte').value);
    const width = parseLocaleFloat(document.getElementById('field-box-breedte').value);
    const height = parseLocaleFloat(document.getElementById('field-box-hoogte').value);
    const quantity = Number.parseInt(document.getElementById('field-box-aantal').value, 10);
    const material = parseLocaleFloat(document.getElementById('field-box-kwaliteit').value);
    const materialText = Mat.options[Mat.selectedIndex].text;
    const color = document.getElementById('field-box-kleur').value;
    const colorText = Col.options[Col.selectedIndex].text;

    clearAlert();

    if (!length || !width || !height || !quantity || !material || !color) {
        document.getElementById('wbc-prices').style.display = 'none';
        return;
    }
    const factor = Number((LOCAL_FACTOR * GLOBAL_FACTOR).toFixed(5));

    if (!(validateNumber(length) && validateNumber(width) && validateNumber(height) && validateNumber(quantity))) {
        AlertMSG('Voer geldige cijfers in voor alle afmetingen en aantallen.');
        return;
    }
    if (quantity < 10 || quantity >= 1001) {
        AlertMSG('De prijs voor minder dan 10 of meer dan 1.000 dozen kunnen wij niet online berekenen. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }
    if (width + length + 8 > 2000) {
        AlertMSG('De afmetingen zijn te groot om de prijs online te berekenen. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }
    if (width + length + width + length + 15 < 600) {
        AlertMSG('Voor deze afmetingen kunnen wij niet direct een prijs berkenen. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }
    if ((width + length + width + length + 15 > 4700) && (quantity > 50)) {
        AlertMSG('Voor deze afmetingen kunnen wij niet direct een prijs berkenen. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }
    if (((width) + (height + 8) < 200)) {
        AlertMSG('De hoogte van de doos is erg beperkt. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }
    if (width + height + 15 > 1800) {
        AlertMSG('De hoogte + breedte is meer dan 1780 mm. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }
    if ((length < width)) {
        AlertMSG('De lengtemaat dient altijd groter te zijn dan de breedte. Pas de lengte/breedte aan.');
        return;
    }
    if ((length < 100)) {
        AlertMSG('De lengte van de doos is erg beperkt. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }
    if ((width < 100)) {
        AlertMSG('De breedte van de doos is erg beperkt. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }
    if ((height < 60)) {
        AlertMSG('De hoogte van de doos is erg beperkt. Neem contact met ons op om hier een offerte voor te ontvangen.');
        return;
    }

    const dimensions = {
        length: mmToM(length),
        width: mmToM(width),
        height: mmToM(height),
    };
    const surface = getSurface(dimensions);
    const factors = {
        global: normalizeGlobalFactor(factor),
        material: material,
        surface: getSurfaceFactor(surface, quantity),
    };

    if (factors.material == null) {
        AlertMSG('Invalid material selection.');
        return;
    }

    const surpluses = {
        circumference: getCircumferenceSurplus(dimensions, quantity),
        color: getColorSurplus(color, surface),
        content: getContentSurplus(dimensions, quantity),
        content1: getContentSurplus1(dimensions, quantity, surface),
        content2: getContentSurplus2(dimensions, quantity, surface),
        content3: getContentSurplus3(dimensions, quantity, surface),
        content4: getContentSurplus4(dimensions, quantity, surface),
        height: getHeightSurplus(dimensions, quantity),
        length: getLengthSurplus(dimensions),
    };
    const modifiers = {
        quantum: getQuantumModifier(quantity),
    };
    const basePrice = getBasePrice(surface, factors);
    const unitPriceExclVat = getUnitPriceExclVat(basePrice, quantity, surpluses, factors, modifiers);
    const unitPriceInclVat = getUnitPriceInclVat(unitPriceExclVat);
    const totalPriceExclVat = getTotalPrice(unitPriceExclVat, quantity);
    const totalPriceInclVat = getTotalPrice(unitPriceInclVat, quantity);

    if (unitPriceExclVat && totalPriceExclVat) {
        const unitPrice = unitPriceExclVat.toFixed(2);
        const totalPrice = totalPriceExclVat.toFixed(2);
        document.getElementById('wbc-detail-quality').textContent = materialText;
        document.getElementById('wbc-detail-color').textContent = colorText;
        document.getElementById('wbc-price-length').textContent = length;
        document.getElementById('wbc-price-width').textContent = width;
        document.getElementById('wbc-price-height').textContent = height;
        document.getElementById('wbc-price-qty').textContent = quantity;
        document.getElementById('wbc-price-unit').textContent = unitPrice.replace('.', ',');
        document.getElementById('wbc-price-total').textContent = totalPrice.replace('.', ',');
        document.getElementById('wbc-prices').style.display = 'block';

        // Fill hidden fields
        document.getElementById('unit-price').value = unitPrice;
        document.getElementById('total-price').value = totalPrice;
        document.getElementById('quantity').value = quantity;
        document.getElementById('dimensions').value = `${length} x ${width} x ${height} mm`;
        document.getElementById('quality').value = materialText;
        document.getElementById('color').value = colorText;
    } else {
        document.getElementById('wbc-prices').style.display = 'none';
    }
}

function getBasePrice(surface, factors) {
    return surface * (factors.material + factors.surface);
}

function getCircumferenceSurplus(dimensions, quantity) {
    const circumference = 2 * (dimensions.length + dimensions.height + 0.04);

    if (circumference > CIRCUMFERENCE_THRESHOLD_1) {
        return 50 / quantity;
    } else if (circumference < CIRCUMFERENCE_THRESHOLD_2) {
        return 0.10;
    }
    return 0;
}

function getColorSurplus(color, surface) {
    return color === '' ? 0.0000001 : parseFloat(color) * surface;
}

function getContentSurplus(dimensions, quantity) {
    const contents = dimensions.length * dimensions.width * dimensions.height;
    const length_width = dimensions.length + dimensions.width;
    let surplus = 0;

    if (contents > CONTENT_THRESHOLD_1) surplus += 0.05;
    if (contents > CONTENT_THRESHOLD_2) surplus += 0;
    if (contents > CONTENT_THRESHOLD_3) surplus += 0.45;
    
    if (length_width > LENGTH_THRESHOLD_3) {
        if (quantity < 10) surplus += 5;
        if (quantity < 20) surplus += 3;
        if (quantity < 50) surplus += 1.5;
        if (quantity < 100) surplus += 0.15;
        if (quantity < 250) surplus += 0.07;
        if (length_width > LENGTH_THRESHOLD_1) surplus += 0.1;
        if (length_width > 1.999) surplus += 0.5;
    }
    return surplus;
}

function getContentSurplus1(dimensions, quantity, surface) {
    return ((dimensions.length + dimensions.width) < 1.050) && (dimensions.width + dimensions.height > 0.240) && (dimensions.width + dimensions.height < 0.80) && (dimensions.width > 0.135) && (surface * quantity > 200) ? -0.02 : 0;
}

function getContentSurplus2(dimensions, quantity, surface) {
    return ((dimensions.length + dimensions.width) < 1.050) && (dimensions.width + dimensions.height > 0.240) && (dimensions.width + dimensions.height < 0.80) && (dimensions.width > 0.135) && (surface * quantity > 500) ? -0.02 : 0;
}

function getContentSurplus3(dimensions, quantity, surface) {
    return ((dimensions.length + dimensions.width) < 1.050) && (dimensions.width + dimensions.height > 0.240) && (dimensions.width + dimensions.height < 0.80) && (dimensions.width > 0.135) && (surface * quantity > 1000) ? -0.02 : 0;
}

function getContentSurplus4(dimensions, quantity, surface) {
    return (quantity < 11) ? ((4 - (64 / quantity) - (quantity * 0.05)) + (70 * (dimensions.length * dimensions.width * dimensions.height))) : 0;
}

function getHeightSurplus(dimensions, quantity) {
    let surplus = 0;

    if ((dimensions.width + dimensions.height) < WIDTH_HEIGHT_THRESHOLD_1) {
        surplus += 80 / quantity;
    }
    if (dimensions.height > HEIGHT_THRESHOLD_1) surplus += 0.12;
    if (dimensions.height > HEIGHT_THRESHOLD_2) surplus += 0.25;
    if (dimensions.height > HEIGHT_THRESHOLD_3) surplus += 0.05;
    if (dimensions.height > HEIGHT_THRESHOLD_4) surplus += 0.05;
    return surplus;
}

function getLengthSurplus(dimensions) {
    let surplus = 0;
    if (dimensions.length > LENGTH_THRESHOLD_1) surplus += 0.25;
    if (dimensions.length > LENGTH_THRESHOLD_2) surplus += 0.25;
    if (dimensions.length > LENGTH_THRESHOLD_3) surplus += 0.25;
    return surplus;
}

function getQuantumModifier(quantity) {
    let modifier = 0;
    if (quantity > 999) modifier -= 0.0;
    if (quantity > 499) modifier -= 0.03;
    if (quantity > 249) modifier -= 0.03;
    if (quantity > 149) modifier -= 0.04;
    if (quantity < 150) modifier += 0.10;
    if (quantity < 250) modifier += 0.06;
    if (quantity < 300) modifier += 0.02;
    return modifier;
}

function getSurface(dimensions) {
    return (2 * (dimensions.length + dimensions.width) + 0.04) * (dimensions.width + dimensions.height);
}

function getSurfaceFactor(surface, quantity) {
    const totalSurface = surface * quantity;
    for (let factor of SURFACE_FACTORS) {
        if (totalSurface < factor.maxSurface) {
            return factor.factor;
        }
    }
    return 0;
}

function getTotalPrice(unitPrice, quantity) {
    return Number.parseFloat(unitPrice.toFixed(2)) * quantity;
}

function getUnitPriceExclVat(basePrice, quantity, surpluses, factors, modifiers) {
    const combinedSurpluses = Object.keys(surpluses).reduce((total, key) => total += surpluses[key], 0);
    const baseSurcharge = BASE_SURCHARGE + (QUANTITY_SURCHARGE / quantity);
    let profitMargin;

    if (quantity < QUANTITY_THRESHOLD_1) {
        profitMargin = PROFIT_MARGIN_SMALL;
    } else if (quantity < QUANTITY_THRESHOLD_2) {
        profitMargin = PROFIT_MARGIN_MEDIUM;
    } else {
        profitMargin = PROFIT_MARGIN_LARGE;
    }

    return ((((basePrice + (baseSurcharge + combinedSurpluses) + modifiers.quantum) * factors.global)) * ADDITIONAL_FACTOR) / profitMargin;
}

function getUnitPriceInclVat(unitPriceExclVat) {
    return unitPriceExclVat * (1 + (VAT_RATE / 100));
}

function mmToM(value) {
    return value / 1000;
}

function normalizeGlobalFactor(factor) {
    return validateNumber(factor) ? factor : 1;
}

function parseLocaleFloat(numeric, stripDelimiters = []) {
    if (typeof numeric !== 'string') return numeric;
    stripDelimiters.forEach(delimiter => numeric = numeric.replace(new RegExp(`[${delimiter}]`, 'g'), ''));
    return Number.parseFloat(numeric.replace(/,/g, '.'));
}

function validateNumber(number) {
    return !Number.isNaN(number) && number > 0;
}

function AlertMSG(Message) {
    clearAlert();
    let form = document.getElementById('wbc-calcform');
    let div = document.createElement('div');
    div.classList.add('alert');
    let text = document.createTextNode(Message);
    div.appendChild(text);
    form.prepend(div);
}

function clearAlert() {
    const el = document.querySelector('.alert');
    if (el) {
        el.remove();
    }
}

function checkAllFieldsFilled() {
    const inputs = document.querySelectorAll('.wbc-calc-field');
    const formInputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"]');
    return Array.from(inputs).every(input => input.value.trim() !== '') &&
           Array.from(formInputs).every(input => input.value.trim() !== '');
}

function updateWarningAndButton() {
    const submitButton = document.getElementById('submit-request');
    const warningMessage = document.getElementById('warning-message');
    const allFilled = checkAllFieldsFilled();
    
    submitButton.disabled = !allFilled;
    warningMessage.style.display = allFilled ? 'none' : 'block';
}

// Attach event listeners to form fields
document.addEventListener('DOMContentLoaded', function() {
    const calcFields = document.querySelectorAll('.wbc-calc-field');
    const formFields = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"]');

    calcFields.forEach(field => {
        field.addEventListener('input', () => {
            calcformCalculate();
            updateWarningAndButton();
        });
    });

    formFields.forEach(field => {
        field.addEventListener('input', updateWarningAndButton);
    });

    document.getElementById('submit-request').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('submit-request').style.display = 'none';
        document.getElementById('loading-indicator').style.display = 'block';
        document.querySelector('form').submit();
    });

    // Initial calculation and warning/button state update
    calcformCalculate();
    updateWarningAndButton();
});

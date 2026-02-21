package com.odaabnote.dto.unit;

import com.odaabnote.domain.Unit;

public record UnitResponse(Long id, String name, int unitOrder) {

    public static UnitResponse from(Unit unit) {
        return new UnitResponse(unit.getId(), unit.getName(), unit.getUnitOrder());
    }
}

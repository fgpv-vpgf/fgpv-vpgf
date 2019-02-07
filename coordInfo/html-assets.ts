export const template = `<div tabindex="-2"><ul class="rv-list">
    <li>
        <strong>{{ 't.coordSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{{ 't.coordDecimal' | translate }}</div>
            <div class="rv-subsection">
            <div>{{ 't.coordLat' | translate }}{pt.y}</div>
            <div>{{ 't.coordLong' | translate }}{pt.x}</div>
            </div>
            <div>{{ 't.coordDMS' | translate }}</div>
            <div class="rv-subsection">
            <div>{{ 't.coordLat' | translate }}{dms.y}</div>
            <div>{{ 't.coordLong' | translate}}{dms.x}</div>
            </div>
        </div>
    </li>
    <li>
        <strong>{{ 't.utmSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{{ 't.utmZone' | translate }}{zone}</div>
            <div>{{ 't.utmEast' | translate }}{outPt.x}</div>
            <div>{{ 't.utmNorth' | translate }}{outPt.y}</div>
        </div>
    </li>
    <li>
        <strong>{{ 't.ntsSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{nts250}</div>
            <div>{nts50}</div>
        </div>
    </li>
    <li>
        <strong>{{ 't.altiSection' | translate }}</strong>
        <div class="rv-subsection">{elevation} m</div>
    </li>
    {magSection}
</ul></div>`;

export const magSection = `<li>
<strong>{{ 't.magSection' | translate }}</strong>
<div class="rv-subsection">
    <div>{{ 't.magDate' | translate }}{date}</div>
    <div>{{ 't.magDecli' | translate }}{magnetic}</div>
    <div>{{ 't.magChange' | translate }}{annChange}</div>
    <div>{compass}</div>
</div>
</li>`;

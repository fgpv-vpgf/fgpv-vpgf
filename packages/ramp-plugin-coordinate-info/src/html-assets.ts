export const template = `<div tabindex="-2"><ul class="rv-list">
    <li>
        <strong>{{ 'plugins.CoordinateInfo.coordSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{{ 'plugins.CoordinateInfo.coordDecimal' | translate }}</div>
            <div class="rv-subsection">
            <div>{{ 'plugins.CoordinateInfo.coordLat' | translate }}{pt.y}</div>
            <div>{{ 'plugins.CoordinateInfo.coordLong' | translate }}{pt.x}</div>
            </div>
            <div>{{ 'plugins.CoordinateInfo.coordDMS' | translate }}</div>
            <div class="rv-subsection">
            <div>{{ 'plugins.CoordinateInfo.coordLat' | translate }}{dms.y}</div>
            <div>{{ 'plugins.CoordinateInfo.coordLong' | translate}}{dms.x}</div>
            </div>
        </div>
    </li>
    <li>
        <strong>{{ 'plugins.CoordinateInfo.utmSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{{ 'plugins.CoordinateInfo.utmZone' | translate }}{zone}</div>
            <div>{{ 'plugins.CoordinateInfo.utmEast' | translate }}{outPt.x}</div>
            <div>{{ 'plugins.CoordinateInfo.utmNorth' | translate }}{outPt.y}</div>
        </div>
    </li>
    <li>
        <strong>{{ 'plugins.CoordinateInfo.ntsSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{nts250}</div>
            <div>{nts50}</div>
        </div>
    </li>
    <li>
        <strong>{{ 'plugins.CoordinateInfo.altiSection' | translate }}</strong>
        <div class="rv-subsection">{elevation} m</div>
    </li>
    {magSection}
</ul></div>`;

export const magSection = `<li>
<strong>{{ 'plugins.CoordinateInfo.magSection' | translate }}</strong>
<div class="rv-subsection">
    <div>{{ 'plugins.CoordinateInfo.magDate' | translate }}{date}</div>
    <div>{{ 'plugins.CoordinateInfo.magDecli' | translate }}{magnetic}</div>
    <div>{{ 'plugins.CoordinateInfo.magChange' | translate }}{annChange}</div>
    <div>{compass}</div>
</div>
</li>`;

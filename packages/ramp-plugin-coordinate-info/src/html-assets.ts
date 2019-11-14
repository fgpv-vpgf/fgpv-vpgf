export const template = `<div tabindex="-2"><ul class="rv-list">
    <li>
        <strong>{{ 'plugins.coordInfo.coordSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{{ 'plugins.coordInfo.coordDecimal' | translate }}</div>
            <div class="rv-subsection">
            <div>{{ 'plugins.coordInfo.coordLat' | translate }}{pt.y}</div>
            <div>{{ 'plugins.coordInfo.coordLong' | translate }}{pt.x}</div>
            </div>
            <div>{{ 'plugins.coordInfo.coordDMS' | translate }}</div>
            <div class="rv-subsection">
            <div>{{ 'plugins.coordInfo.coordLat' | translate }}{dms.y}</div>
            <div>{{ 'plugins.coordInfo.coordLong' | translate}}{dms.x}</div>
            </div>
        </div>
    </li>
    <li>
        <strong>{{ 'plugins.coordInfo.utmSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{{ 'plugins.coordInfo.utmZone' | translate }}{zone}</div>
            <div>{{ 'plugins.coordInfo.utmEast' | translate }}{outPt.x}</div>
            <div>{{ 'plugins.coordInfo.utmNorth' | translate }}{outPt.y}</div>
        </div>
    </li>
    <li>
        <strong>{{ 'plugins.coordInfo.ntsSection' | translate }}</strong>
        <div class="rv-subsection">
            <div>{nts250}</div>
            <div>{nts50}</div>
        </div>
    </li>
    <li>
        <strong>{{ 'plugins.coordInfo.altiSection' | translate }}</strong>
        <div class="rv-subsection">{elevation} m</div>
    </li>
    {magSection}
</ul></div>`;

export const magSection = `<li>
<strong>{{ 'plugins.coordInfo.magSection' | translate }}</strong>
<div class="rv-subsection">
    <div>{{ 'plugins.coordInfo.magDate' | translate }}{date}</div>
    <div>{{ 'plugins.coordInfo.magDecli' | translate }}{magnetic}</div>
    <div>{{ 'plugins.coordInfo.magChange' | translate }}{annChange}</div>
    <div>{compass}</div>
</div>
</li>`;

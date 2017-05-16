/* global RV */

const XML_SAMPLE = `
    <gmd:MD_Metadata xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:srv="http://www.isotc211.org/2005/srv" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:gmx="http://www.isotc211.org/2005/gmx" xmlns:napec="http://www.ec.gc.ca/data_donnees/standards/schemas/napec" xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:napm="http://www.geoconnections.org/nap/napMetadataTools/napXsd/napm" xmlns:gfc="http://www.isotc211.org/2005/gfc" xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:geonet="http://www.fao.org/geonetwork">
    <gmd:fileIdentifier>
        <gco:CharacterString>7816268a-aafa-43cf-91d2-259fca183d07</gco:CharacterString>
    </gmd:fileIdentifier>
    <gmd:language>
        <gco:CharacterString>eng; CAN</gco:CharacterString>
    </gmd:language>
    <gmd:characterSet>
        <gmd:MD_CharacterSetCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_95" codeListValue="RI_458">utf8; utf8</gmd:MD_CharacterSetCode>
    </gmd:characterSet>
    <gmd:hierarchyLevel>
        <gmd:MD_ScopeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_108" codeListValue="RI_623">series; série</gmd:MD_ScopeCode>
    </gmd:hierarchyLevel>
    <gmd:contact>
        <gmd:CI_ResponsibleParty>
        <gmd:individualName gco:nilReason="missing">
            <gco:CharacterString />
        </gmd:individualName>
        <gmd:organisationName gco:nilReason="missing">
            <gco:CharacterString />
        </gmd:organisationName>
        <gmd:positionName gco:nilReason="missing">
            <gco:CharacterString />
        </gmd:positionName>
        <gmd:contactInfo>
            <gmd:CI_Contact>
            <gmd:phone>
                <gmd:CI_Telephone>
                <gmd:voice gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:voice>
                <gmd:facsimile gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:facsimile>
                </gmd:CI_Telephone>
            </gmd:phone>
            <gmd:address>
                <gmd:CI_Address>
                <gmd:deliveryPoint gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:deliveryPoint>
                <gmd:city gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:city>
                <gmd:administrativeArea gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:administrativeArea>
                <gmd:postalCode gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:postalCode>
                <gmd:country xsi:type="gmd:PT_FreeText_PropertyType">
                    <gco:CharacterString />
                    <gmd:PT_FreeText>
                    <gmd:textGroup>
                        <gmd:LocalisedCharacterString locale="#fra" />
                    </gmd:textGroup>
                    </gmd:PT_FreeText>
                </gmd:country>
                <gmd:electronicMailAddress gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:electronicMailAddress>
                </gmd:CI_Address>
            </gmd:address>
            </gmd:CI_Contact>
        </gmd:contactInfo>
        <gmd:role>
            <gmd:CI_RoleCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_90" codeListValue="" />
        </gmd:role>
        </gmd:CI_ResponsibleParty>
    </gmd:contact>
    <gmd:dateStamp>
        <gco:DateTime>2015-05-12T17:23:05</gco:DateTime>
    </gmd:dateStamp>
    <gmd:metadataStandardName>
        <gco:CharacterString>North American Profile of ISO 19115 Geographic Information Metadata</gco:CharacterString>
    </gmd:metadataStandardName>
    <gmd:metadataStandardVersion>
        <gco:CharacterString>Enviroment Canada - Version 1</gco:CharacterString>
    </gmd:metadataStandardVersion>
    <gmd:dataSetURI gco:nilReason="missing">
        <gco:CharacterString />
    </gmd:dataSetURI>
    <gmd:locale>
        <gmd:PT_Locale id="fra">
        <gmd:languageCode>
            <gmd:LanguageCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_116" codeListValue="fra">English; Anglais</gmd:LanguageCode>
        </gmd:languageCode>
        <gmd:country>
            <gmd:Country codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_117" codeListValue="CAN">Canada; Canada</gmd:Country>
        </gmd:country>
        <gmd:characterEncoding>
            <gmd:MD_CharacterSetCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_95" codeListValue="RI_458">utf8; utf8</gmd:MD_CharacterSetCode>
        </gmd:characterEncoding>
        </gmd:PT_Locale>
    </gmd:locale>
    <gmd:referenceSystemInfo>
        <gmd:MD_ReferenceSystem>
        <gmd:referenceSystemIdentifier>
            <gmd:RS_Identifier>
            <gmd:code>
                <gco:CharacterString>4326</gco:CharacterString>
            </gmd:code>
            <gmd:codeSpace>
                <gco:CharacterString>EPSG</gco:CharacterString>
            </gmd:codeSpace>
            <gmd:version gco:nilReason="missing">
                <gco:CharacterString />
            </gmd:version>
            </gmd:RS_Identifier>
        </gmd:referenceSystemIdentifier>
        </gmd:MD_ReferenceSystem>
    </gmd:referenceSystemInfo>
    <gmd:identificationInfo>
        <napec:MD_DataIdentification gco:isoType="gmd:MD_DataIdentification">
        <gmd:citation>
            <gmd:CI_Citation>
            <gmd:title xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>Lake Winnipeg Basin Stewardship Fund - Map of Funded Projects</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">Fonds d'intendance du bassin du lac Winnipeg - carte des projets financés</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:title>
            <gmd:date>
                <gmd:CI_Date>
                <gmd:date>
                    <gco:Date xsi:nil="true">2015-02-24</gco:Date>
                </gmd:date>
                <gmd:dateType>
                    <gmd:CI_DateTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_87" codeListValue="RI_366">creation; création</gmd:CI_DateTypeCode>
                </gmd:dateType>
                </gmd:CI_Date>
            </gmd:date>
            <gmd:citedResponsibleParty>
                <gmd:CI_ResponsibleParty>
                <gmd:individualName gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:individualName>
                <gmd:organisationName gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:organisationName>
                <gmd:positionName gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:positionName>
                <gmd:contactInfo>
                    <gmd:CI_Contact>
                    <gmd:phone>
                        <gmd:CI_Telephone>
                        <gmd:voice gco:nilReason="missing">
                            <gco:CharacterString />
                        </gmd:voice>
                        <gmd:facsimile gco:nilReason="missing">
                            <gco:CharacterString />
                        </gmd:facsimile>
                        </gmd:CI_Telephone>
                    </gmd:phone>
                    <gmd:address>
                        <gmd:CI_Address>
                        <gmd:deliveryPoint gco:nilReason="missing">
                            <gco:CharacterString />
                        </gmd:deliveryPoint>
                        <gmd:city gco:nilReason="missing">
                            <gco:CharacterString />
                        </gmd:city>
                        <gmd:administrativeArea gco:nilReason="missing">
                            <gco:CharacterString />
                        </gmd:administrativeArea>
                        <gmd:postalCode gco:nilReason="missing">
                            <gco:CharacterString />
                        </gmd:postalCode>
                        <gmd:country xsi:type="gmd:PT_FreeText_PropertyType">
                            <gco:CharacterString />
                            <gmd:PT_FreeText>
                            <gmd:textGroup>
                                <gmd:LocalisedCharacterString locale="#fra" />
                            </gmd:textGroup>
                            </gmd:PT_FreeText>
                        </gmd:country>
                        <gmd:electronicMailAddress gco:nilReason="missing">
                            <gco:CharacterString />
                        </gmd:electronicMailAddress>
                        </gmd:CI_Address>
                    </gmd:address>
                    </gmd:CI_Contact>
                </gmd:contactInfo>
                <gmd:role>
                    <gmd:CI_RoleCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_90" codeListValue="" />
                </gmd:role>
                </gmd:CI_ResponsibleParty>
            </gmd:citedResponsibleParty>
            </gmd:CI_Citation>
        </gmd:citation>
        <gmd:abstract xsi:type="gmd:PT_FreeText_PropertyType">
            <gco:CharacterString>The Government of Canada is committed to the long-term sustainability of Canada's lakes and waterways to ensure that there is clean water for all Canadians, both for this, and future, generations. To this end, on August 2nd, 2012, Prime Minister Stephen Harper announced the launch of Phase II of the Lake Winnipeg Basin Initiative (LWBI) with a five-year (2012-2017), $18 million investment through the Action Plan for Clean Water that will focus on improving water quality for people living in the region, as well as for fish and wildlife in and surrounding Lake Winnipeg.

    The Lake Winnipeg Basin Initiative aims to restore the ecological health of Lake Winnipeg, reduce pollution from sources such as agriculture, industry and wastewater, and improve water quality for fisheries and recreation. The Lake Winnipeg ecosystem supports an annual freshwater fishery of $50 million and a $110 million recreation and tourism industry.

    In addition, the Government of Canada is also providing support for community based projects through the Lake Winnipeg Basin Stewardship Fund - part of the Lake Winnipeg Basin Initiative and administered through Environment Canada's Lake Winnipeg Basin Office. The fund is cleaning up Lake Winnipeg by providing support to action-oriented water stewardship projects led by communities, conservation authorities, non-profit organizations and academic institutions.

    The following is a  map describing the Lake Winnipeg Basin Stewardship Fund's funded projects at their geographical locations in Google earth.

    To download Google earth copy this link,
    http://www.google.com/earth/download/ge/agree.html</gco:CharacterString>
            <gmd:PT_FreeText>
            <gmd:textGroup>
                <gmd:LocalisedCharacterString locale="#fra">Le gouvernement du Canada est résolu à favoriser la durabilité à long terme des lacs et cours d'eau du Canada afin de faire en sorte que tous les Canadiens aient accès à de l'eau propre, dès maintenant et pour l'avenir. à cette fin, le premier ministre Stephen Harper a annoncé le 2 août 2012 le lancement de la phase II de l'Initiative du bassin du lac Winnipeg grâce à un investissement de 18 millions de dollars sur cinq ans (2012-2017) par l'entremise du Plan d'action pour l'assainissement de l'eau. L'accent sera mis sur l'amélioration de la qualité de l'eau pour les personnes vivant dans la région, ainsi que pour la faune aquatique et terrestre du lac Winnipeg et de ses environs.

    L'Initiative du bassin du lac Winnipeg vise à restaurer la santé écologique du lac Winnipeg, à réduire la pollution causée par des sources comme l'agriculture, l'industrie et les eaux usées, et à améliorer la qualité de l'eau pour les pêches et les loisirs. L'écosystème du lac Winnipeg est à l'origine de revenus annuels de 50 millions de dollars issus de la pêche en eau douce et de 110 millions de dollars pour l'industrie du tourisme et des loisirs.

    De plus, le gouvernement du Canada offre également un soutien aux projets communautaires par l'intermédiaire du Fonds d'intendance du bassin du lac Winnipeg, qui fait partie de l'Initiative du bassin du lac Winnipeg et est géré par le Bureau du bassin du lac Winnipeg d'Environnement Canada. Ce fonds permet l'assainissement du lac Winnipeg en soutenant les projets d'intendance de l'eau axés sur l'action menés par des collectivités, des offices de protection de la nature, des organisations à but non lucratif et des établissements d'enseignement.

    Ceci est une carte décrivant les projets duInitiative du bassin du lac Winnipeg financés
    à leurs emplacements géographiques dans Google Earth.

    Pour télécharger Google Earth, suivez ce lien,
    http://www.google.fr/earth/download/ge/agree.html</gmd:LocalisedCharacterString>
            </gmd:textGroup>
            </gmd:PT_FreeText>
        </gmd:abstract>
        <gmd:pointOfContact>
            <gmd:CI_ResponsibleParty>
            <gmd:individualName>
                <gco:CharacterString>Teresa Senderewich</gco:CharacterString>
            </gmd:individualName>
            <gmd:organisationName xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>Lake Winnipeg Basin Stewardship Fund</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">Fonds d'intendance du bassin du lac Winnipeg</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:organisationName>
            <gmd:positionName xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>Administrative Assistant</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">adjointe administrative</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:positionName>
            <gmd:contactInfo>
                <gmd:CI_Contact>
                <gmd:phone>
                    <gmd:CI_Telephone>
                    <gmd:voice>
                        <gco:CharacterString>204-983-7776</gco:CharacterString>
                    </gmd:voice>
                    <gmd:facsimile gco:nilReason="missing">
                        <gco:CharacterString />
                    </gmd:facsimile>
                    </gmd:CI_Telephone>
                </gmd:phone>
                <gmd:address>
                    <gmd:CI_Address>
                    <gmd:deliveryPoint xsi:type="gmd:PT_FreeText_PropertyType">
                        <gco:CharacterString>Suite 150 - 123 Main Street</gco:CharacterString>
                        <gmd:PT_FreeText>
                        <gmd:textGroup>
                            <gmd:LocalisedCharacterString locale="#fra">Suite 150 - 123 Main Street</gmd:LocalisedCharacterString>
                        </gmd:textGroup>
                        </gmd:PT_FreeText>
                    </gmd:deliveryPoint>
                    <gmd:city>
                        <gco:CharacterString>Winnipeg</gco:CharacterString>
                    </gmd:city>
                    <gmd:administrativeArea>
                        <gco:CharacterString>MB</gco:CharacterString>
                    </gmd:administrativeArea>
                    <gmd:postalCode>
                        <gco:CharacterString>R3C 4W2</gco:CharacterString>
                    </gmd:postalCode>
                    <gmd:country xsi:type="gmd:PT_FreeText_PropertyType">
                        <gco:CharacterString>CAN (Canada)</gco:CharacterString>
                        <gmd:PT_FreeText>
                        <gmd:textGroup>
                            <gmd:LocalisedCharacterString locale="#fra">CAN (Canada)</gmd:LocalisedCharacterString>
                        </gmd:textGroup>
                        </gmd:PT_FreeText>
                    </gmd:country>
                    <gmd:electronicMailAddress>
                        <gco:CharacterString>Teresa.Senderewich@EC.gc.ca</gco:CharacterString>
                    </gmd:electronicMailAddress>
                    </gmd:CI_Address>
                </gmd:address>
                <gmd:onlineResource>
                    <gmd:CI_OnlineResource>
                    <gmd:linkage gco:nilReason="missing">
                        <gmd:URL />
                    </gmd:linkage>
                    <gmd:protocol gco:nilReason="missing">
                        <gco:CharacterString />
                    </gmd:protocol>
                    </gmd:CI_OnlineResource>
                </gmd:onlineResource>
                <gmd:hoursOfService xsi:type="gmd:PT_FreeText_PropertyType">
                    <gco:CharacterString>8:00-4:00pm</gco:CharacterString>
                    <gmd:PT_FreeText>
                    <gmd:textGroup>
                        <gmd:LocalisedCharacterString locale="#fra">8:00-4:00pm</gmd:LocalisedCharacterString>
                    </gmd:textGroup>
                    </gmd:PT_FreeText>
                </gmd:hoursOfService>
                </gmd:CI_Contact>
            </gmd:contactInfo>
            <gmd:role>
                <gmd:CI_RoleCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_90" codeListValue="RI_414">pointOfContact; contact</gmd:CI_RoleCode>
            </gmd:role>
            </gmd:CI_ResponsibleParty>
        </gmd:pointOfContact>
        <gmd:resourceMaintenance>
            <gmd:MD_MaintenanceInformation>
            <gmd:maintenanceAndUpdateFrequency>
                <gmd:MD_MaintenanceFrequencyCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_102" codeListValue="RI_540">asNeeded; auBesoin</gmd:MD_MaintenanceFrequencyCode>
            </gmd:maintenanceAndUpdateFrequency>
            </gmd:MD_MaintenanceInformation>
        </gmd:resourceMaintenance>
        <gmd:graphicOverview>
            <gmd:MD_BrowseGraphic>
            <gmd:fileName>
                <gco:CharacterString>getmap.png</gco:CharacterString>
            </gmd:fileName>
            <gmd:fileDescription>
                <gco:CharacterString>large_thumbnail</gco:CharacterString>
            </gmd:fileDescription>
            <gmd:fileType>
                <napm:napMD_FileFormatCode codeList="http://nap.geogratis.gc.ca/metadata/register/registerItemClasses-eng.html#IC_115" codeListValue="RI_716">png; png</napm:napMD_FileFormatCode>
            </gmd:fileType>
            </gmd:MD_BrowseGraphic>
        </gmd:graphicOverview>
        <gmd:descriptiveKeywords>
            <gmd:MD_Keywords>
            <gmd:keyword xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>Water</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">Eau</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:keyword>
            <gmd:type>
                <gmd:MD_KeywordTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_101" codeListValue="RI_528">theme; thème</gmd:MD_KeywordTypeCode>
            </gmd:type>
            <gmd:thesaurusName>
                <gmd:CI_Citation id="local.theme.EC_Information_Category">
                <gmd:title>
                    <gco:CharacterString>local.theme.EC_Information_Category</gco:CharacterString>
                </gmd:title>
                <gmd:date>
                    <gmd:CI_Date>
                    <gmd:date>
                        <gco:Date>2012-05-25</gco:Date>
                    </gmd:date>
                    <gmd:dateType>
                        <gmd:CI_DateTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_87" codeListValue="RI_367">publication; publication</gmd:CI_DateTypeCode>
                    </gmd:dateType>
                    </gmd:CI_Date>
                </gmd:date>
                <gmd:citedResponsibleParty />
                </gmd:CI_Citation>
            </gmd:thesaurusName>
            </gmd:MD_Keywords>
        </gmd:descriptiveKeywords>
        <gmd:descriptiveKeywords>
            <gmd:MD_Keywords>
            <gmd:keyword xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>Water - Major drainage area - Western and Northern Hudson Bay</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">L'eau - Aire de drainage principale - Ouest et Nord de la baie d’Hudson</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:keyword>
            <gmd:type>
                <gmd:MD_KeywordTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_101" codeListValue="RI_525">place; endroit</gmd:MD_KeywordTypeCode>
            </gmd:type>
            <gmd:thesaurusName>
                <gmd:CI_Citation id="local.place.EC_Geographic_Scope">
                <gmd:title>
                    <gco:CharacterString>local.place.EC_Geographic_Scope</gco:CharacterString>
                </gmd:title>
                <gmd:date>
                    <gmd:CI_Date>
                    <gmd:date>
                        <gco:Date>2012-05-25</gco:Date>
                    </gmd:date>
                    <gmd:dateType>
                        <gmd:CI_DateTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_87" codeListValue="RI_367">publication; publication</gmd:CI_DateTypeCode>
                    </gmd:dateType>
                    </gmd:CI_Date>
                </gmd:date>
                <gmd:citedResponsibleParty />
                </gmd:CI_Citation>
            </gmd:thesaurusName>
            </gmd:MD_Keywords>
        </gmd:descriptiveKeywords>
        <gmd:descriptiveKeywords>
            <gmd:MD_Keywords>
            <gmd:keyword xsi:type="gmd:PT_FreeText_PropertyType" gco:nilReason="missing">
                <gco:CharacterString />
            </gmd:keyword>
            <gmd:type>
                <gmd:MD_KeywordTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_101" codeListValue="RI_528">theme; thème</gmd:MD_KeywordTypeCode>
            </gmd:type>
            <gmd:thesaurusName>
                <gmd:CI_Citation id="local.theme.EC_Content_Scope">
                <gmd:title>
                    <gco:CharacterString>local.theme.EC_Content_Scope</gco:CharacterString>
                </gmd:title>
                <gmd:date>
                    <gmd:CI_Date>
                    <gmd:date>
                        <gco:Date>2012-05-25</gco:Date>
                    </gmd:date>
                    <gmd:dateType>
                        <gmd:CI_DateTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_87" codeListValue="RI_367">publication; publication</gmd:CI_DateTypeCode>
                    </gmd:dateType>
                    </gmd:CI_Date>
                </gmd:date>
                <gmd:citedResponsibleParty />
                </gmd:CI_Citation>
            </gmd:thesaurusName>
            </gmd:MD_Keywords>
        </gmd:descriptiveKeywords>
        <gmd:descriptiveKeywords>
            <gmd:MD_Keywords id="classification-theme">
            <gmd:keyword xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>Engagement and Partnership with External Regulators and Governing Bodies</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">Engagement et partenariat avec les régulateurs externes et les organes directeurs</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:keyword>
            <gmd:type>
                <gmd:MD_KeywordTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_101" codeListValue="RI_528">theme; thème</gmd:MD_KeywordTypeCode>
            </gmd:type>
            <gmd:thesaurusName>
                <gmd:CI_Citation id="local.theme.EC_Waf">
                <gmd:title>
                    <gco:CharacterString>local.theme.EC_Waf</gco:CharacterString>
                </gmd:title>
                <gmd:date>
                    <gmd:CI_Date>
                    <gmd:date>
                        <gco:Date>2012-05-25</gco:Date>
                    </gmd:date>
                    <gmd:dateType>
                        <gmd:CI_DateTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_87" codeListValue="RI_367">publication; publication</gmd:CI_DateTypeCode>
                    </gmd:dateType>
                    </gmd:CI_Date>
                </gmd:date>
                <gmd:citedResponsibleParty />
                </gmd:CI_Citation>
            </gmd:thesaurusName>
            </gmd:MD_Keywords>
        </gmd:descriptiveKeywords>
        <gmd:descriptiveKeywords>
            <gmd:MD_Keywords id="classification-subtheme">
            <gmd:keyword xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>Set-up and Administer Grants &amp; Contributions Agreements for External Regulators and Governing Bodies</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">Préparer et administrer des accords de subventions et de contributions pour les organismes de réglementation et dirigeants/instances externes</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:keyword>
            <gmd:type>
                <gmd:MD_KeywordTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_101" codeListValue="RI_528">theme; thème</gmd:MD_KeywordTypeCode>
            </gmd:type>
            <gmd:thesaurusName>
                <gmd:CI_Citation id="local.theme.EC_Waf">
                <gmd:title>
                    <gco:CharacterString>local.theme.EC_Waf</gco:CharacterString>
                </gmd:title>
                <gmd:date>
                    <gmd:CI_Date>
                    <gmd:date>
                        <gco:Date>2012-05-25</gco:Date>
                    </gmd:date>
                    <gmd:dateType>
                        <gmd:CI_DateTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_87" codeListValue="RI_367">publication; publication</gmd:CI_DateTypeCode>
                    </gmd:dateType>
                    </gmd:CI_Date>
                </gmd:date>
                <gmd:citedResponsibleParty />
                </gmd:CI_Citation>
            </gmd:thesaurusName>
            </gmd:MD_Keywords>
        </gmd:descriptiveKeywords>
        <gmd:descriptiveKeywords>
            <gmd:MD_Keywords>
            <gmd:keyword xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>NE Nature and Environment &gt; Water</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">NE Nature and Environment  &gt; Eau</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:keyword>
            <gmd:type>
                <gmd:MD_KeywordTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_101" codeListValue="RI_528">theme; thème</gmd:MD_KeywordTypeCode>
            </gmd:type>
            <gmd:thesaurusName>
                <gmd:CI_Citation>
                <gmd:title xsi:type="gmd:PT_FreeText_PropertyType">
                    <gco:CharacterString>Government of Canada Core Subject Thesaurus</gco:CharacterString>
                    <gmd:PT_FreeText>
                    <gmd:textGroup>
                        <gmd:LocalisedCharacterString locale="#fra">Thésaurus des sujets de base du gouvernement du Canada</gmd:LocalisedCharacterString>
                    </gmd:textGroup>
                    </gmd:PT_FreeText>
                </gmd:title>
                <gmd:date>
                    <gmd:CI_Date>
                    <gmd:date>
                        <gco:Date>2011-05-16</gco:Date>
                    </gmd:date>
                    <gmd:dateType>
                        <gmd:CI_DateTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_87" codeListValue="RI_367">publication; publication</gmd:CI_DateTypeCode>
                    </gmd:dateType>
                    </gmd:CI_Date>
                </gmd:date>
                <gmd:citedResponsibleParty>
                    <gmd:CI_ResponsibleParty>
                    <gmd:organisationName xsi:type="gmd:PT_FreeText_PropertyType">
                        <gco:CharacterString>Government of Canada; Library and Archives Canada</gco:CharacterString>
                        <gmd:PT_FreeText>
                        <gmd:textGroup>
                            <gmd:LocalisedCharacterString locale="#fra">Gouvernement du Canada; Bibliothèque et Archives Canada</gmd:LocalisedCharacterString>
                        </gmd:textGroup>
                        </gmd:PT_FreeText>
                    </gmd:organisationName>
                    <gmd:role>
                        <gmd:CI_RoleCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_90" codeListValue="RI_409">custodian; conservateur</gmd:CI_RoleCode>
                    </gmd:role>
                    </gmd:CI_ResponsibleParty>
                </gmd:citedResponsibleParty>
                </gmd:CI_Citation>
            </gmd:thesaurusName>
            </gmd:MD_Keywords>
        </gmd:descriptiveKeywords>
        <gmd:resourceConstraints>
            <gmd:MD_LegalConstraints>
            <gmd:useLimitation xsi:type="gmd:PT_FreeText_PropertyType">
                <gco:CharacterString>Open Government Licence - Canada – (http://open.canada.ca/en/open-government-licence-canada)</gco:CharacterString>
                <gmd:PT_FreeText>
                <gmd:textGroup>
                    <gmd:LocalisedCharacterString locale="#fra">Licence du gouvernement ouvert – Canada (http://ouvert.canada.ca/fr/licence-du-gouvernement-ouvert-canada)</gmd:LocalisedCharacterString>
                </gmd:textGroup>
                </gmd:PT_FreeText>
            </gmd:useLimitation>
            <gmd:accessConstraints>
                <gmd:MD_RestrictionCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_107" codeListValue="RI_606">license; licence</gmd:MD_RestrictionCode>
            </gmd:accessConstraints>
            <gmd:useConstraints>
                <gmd:MD_RestrictionCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_107" codeListValue="" />
            </gmd:useConstraints>
            </gmd:MD_LegalConstraints>
        </gmd:resourceConstraints>
        <gmd:spatialRepresentationType>
            <gmd:MD_SpatialRepresentationTypeCode codeList="http://nap.geogratis.gc.ca/metadata/register/napMetadataRegister.xml#IC_109" codeListValue="RI_635">vector; vecteur</gmd:MD_SpatialRepresentationTypeCode>
        </gmd:spatialRepresentationType>
        <gmd:language>
            <gco:CharacterString>eng; CAN</gco:CharacterString>
        </gmd:language>
        <gmd:characterSet>
            <gmd:MD_CharacterSetCode codeList="http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/ML_gmxCodelists.xml#MD_CharacterSetCode" codeListValue="RI_458" />
        </gmd:characterSet>
        <gmd:topicCategory gco:nilReason="missing">
            <gmd:MD_TopicCategoryCode>imageryBaseMapsEarthCover</gmd:MD_TopicCategoryCode>
        </gmd:topicCategory>
        <gmd:environmentDescription gco:nilReason="missing">
            <gco:CharacterString />
        </gmd:environmentDescription>
        <gmd:extent>
            <gmd:EX_Extent>
            <gmd:temporalElement>
                <gmd:EX_TemporalExtent>
                <gmd:extent>
                    <gml:TimePeriod gml:id="timeperiod1">
                    <gml:beginPosition>2015-02-24</gml:beginPosition>
                    <gml:endPosition />
                    </gml:TimePeriod>
                </gmd:extent>
                </gmd:EX_TemporalExtent>
            </gmd:temporalElement>
            </gmd:EX_Extent>
        </gmd:extent>
        <gmd:extent>
            <gmd:EX_Extent>
            <gmd:geographicElement>
                <gmd:EX_GeographicBoundingBox>
                <gmd:westBoundLongitude>
                    <gco:Decimal>-141.003</gco:Decimal>
                </gmd:westBoundLongitude>
                <gmd:eastBoundLongitude>
                    <gco:Decimal>-52.6174</gco:Decimal>
                </gmd:eastBoundLongitude>
                <gmd:southBoundLatitude>
                    <gco:Decimal>41.6755</gco:Decimal>
                </gmd:southBoundLatitude>
                <gmd:northBoundLatitude>
                    <gco:Decimal>83.1139</gco:Decimal>
                </gmd:northBoundLatitude>
                </gmd:EX_GeographicBoundingBox>
            </gmd:geographicElement>
            </gmd:EX_Extent>
        </gmd:extent>
        <gmd:supplementalInformation gco:nilReason="missing">
            <gco:CharacterString />
        </gmd:supplementalInformation>
        <napec:EC_CorporateInfo>
            <napec:EC_Branch>
            <napec:EC_Branch_TypeCode codeListValue="regional_directors_general_offices" codeList="http://www.ec.gc.ca/data_donnees/standards/schemas/napec#EC_Branch" />
            </napec:EC_Branch>
            <napec:EC_Directorate>
            <napec:EC_Directorate_TypeCode codeListValue="west_north_regions" codeList="http://www.ec.gc.ca/data_donnees/standards/schemas/napec#EC_Directorate" />
            </napec:EC_Directorate>
            <napec:EC_Project xsi:type="gmd:PT_FreeText_PropertyType">
            <gco:CharacterString>Lake Winnipeg Basin Initiative</gco:CharacterString>
            <gmd:PT_FreeText>
                <gmd:textGroup>
                <gmd:LocalisedCharacterString locale="#fra">Initiative du bassin du lac Winnipeg</gmd:LocalisedCharacterString>
                </gmd:textGroup>
            </gmd:PT_FreeText>
            </napec:EC_Project>
            <napec:GC_Security_Classification>
            <napec:GC_Security_Classification_TypeCode codeListValue="unclassified" codeList="http://www.ec.gc.ca/data_donnees/standards/schemas/napec#GC_Security_Classification" />
            </napec:GC_Security_Classification>
            <napec:EC_Program>
            <napec:EC_Program_TypeCode codeListValue="" codeList="http://www.ec.gc.ca/data_donnees/standards/schemas/napec#EC_Program" />
            </napec:EC_Program>
        </napec:EC_CorporateInfo>
        </napec:MD_DataIdentification>
    </gmd:identificationInfo>
    <gmd:distributionInfo>
        <gmd:MD_Distribution>
        <gmd:distributionFormat xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor13">
            <gmd:MD_Format>
            <gmd:name>
                <gco:CharacterString>Shapefile</gco:CharacterString>
            </gmd:name>
            <gmd:version>
                <gco:CharacterString>1.0</gco:CharacterString>
            </gmd:version>
            </gmd:MD_Format>
        </gmd:distributionFormat>
        <gmd:distributionFormat xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor13">
            <gmd:MD_Format>
            <gmd:name>
                <gco:CharacterString>Shapefile</gco:CharacterString>
            </gmd:name>
            <gmd:version>
                <gco:CharacterString>1.0</gco:CharacterString>
            </gmd:version>
            </gmd:MD_Format>
        </gmd:distributionFormat>
        <gmd:distributionFormat xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor15">
            <gmd:MD_Format>
            <gmd:name>
                <gco:CharacterString>CSV</gco:CharacterString>
            </gmd:name>
            <gmd:version>
                <gco:CharacterString>1.0</gco:CharacterString>
            </gmd:version>
            </gmd:MD_Format>
        </gmd:distributionFormat>
        <gmd:distributionFormat xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor15">
            <gmd:MD_Format>
            <gmd:name>
                <gco:CharacterString>CSV</gco:CharacterString>
            </gmd:name>
            <gmd:version>
                <gco:CharacterString>1.0</gco:CharacterString>
            </gmd:version>
            </gmd:MD_Format>
        </gmd:distributionFormat>
        <gmd:distributionFormat xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor16">
            <gmd:MD_Format>
            <gmd:name>
                <gco:CharacterString>JSON</gco:CharacterString>
            </gmd:name>
            <gmd:version gco:nilReason="missing">
                <gco:CharacterString />
            </gmd:version>
            </gmd:MD_Format>
        </gmd:distributionFormat>
        <gmd:distributionFormat xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor16">
            <gmd:MD_Format>
            <gmd:name>
                <gco:CharacterString>JSON</gco:CharacterString>
            </gmd:name>
            <gmd:version gco:nilReason="missing">
                <gco:CharacterString />
            </gmd:version>
            </gmd:MD_Format>
        </gmd:distributionFormat>
        <gmd:distributor>
            <gmd:MD_Distributor>
            <gmd:distributorContact />
            </gmd:MD_Distributor>
        </gmd:distributor>
        <gmd:transferOptions>
            <gmd:MD_DigitalTransferOptions>
            <gmd:onLine xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor11">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/LWB_Funded_Projects_MapEng.kmz</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="application/vnd.google-earth.kmz">LWB Funded Projects Map(Eng).kmz</gmx:MimeFileType>
                </gmd:name>
                <gmd:description>
                    <gco:CharacterString>The following is a  map describing the Lake Winnipeg Basin Stewardship Fund's funded projects at their geographical locations in Google earth. This is the English version.</gco:CharacterString>
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor11">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/LWB_Funded_Projects_MapEng.kmz</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="application/vnd.google-earth.kmz">LWB Funded Projects Map(Eng).kmz</gmx:MimeFileType>
                </gmd:name>
                <gmd:description>
                    <gco:CharacterString>Ceci est une carte décrivant les projets duInitiative du bassin du lac Winnipeg finances à leurs emplacements géographiques dans Google Earth. Ceci est le version anglais.</gco:CharacterString>
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor12">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/Bassin_du_lac_Winnipeg_cartes_des_projets_financsFr.kmz</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="application/vnd.google-earth.kmz">Bassin du lac Winnipeg cartes des projets financés(Fr).kmz</gmx:MimeFileType>
                </gmd:name>
                <gmd:description>
                    <gco:CharacterString>The following is a  map describing the Lake Winnipeg Basin Stewardship Fund's funded projects at their geographical locations in Google earth. This is the French version.</gco:CharacterString>
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor12">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/Bassin_du_lac_Winnipeg_cartes_des_projets_financsFr.kmz</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="application/vnd.google-earth.kmz">Bassin du lac Winnipeg cartes des projets financés(Fr).kmz</gmx:MimeFileType>
                </gmd:name>
                <gmd:description>
                    <gco:CharacterString>Ceci est une carte décrivant les projets duInitiative du bassin du lac Winnipeg finances à leurs emplacements géographiques dans Google Earth. Ceci est le version francais</gco:CharacterString>
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor13">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/LWBMapCarte.zip</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="application/x-compressed">LWBMapCarte.zip</gmx:MimeFileType>
                </gmd:name>
                <gmd:description>
                    <gco:CharacterString>Shape file for the Lake Winnipeg Basin map</gco:CharacterString>
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor13">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/LWBMapCarte.zip</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="application/x-compressed">LWBMapCarte.zip</gmx:MimeFileType>
                </gmd:name>
                <gmd:description>
                    <gco:CharacterString>Forme fichier pour la carte du bassin du lac Winnipeg</gco:CharacterString>
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor15">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/LWBMapCarte.csv</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="text/csv">LWBMapCarte.csv</gmx:MimeFileType>
                </gmd:name>
                <gmd:description gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor15">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/LWBMapCarte.csv</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="text/csv">LWBMapCarte.csv</gmx:MimeFileType>
                </gmd:name>
                <gmd:description gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor16">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/LWBMapCarte.json</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="image/x-pcx">LWBMapCarte.json</gmx:MimeFileType>
                </gmd:name>
                <gmd:description gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor16">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects/LWBMapCarte.json</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gmx:MimeFileType type="image/x-pcx">LWBMapCarte.json</gmx:MimeFileType>
                </gmd:name>
                <gmd:description gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor17">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gco:CharacterString>View EC Data Mart</gco:CharacterString>
                </gmd:name>
                <gmd:description />
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor17">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://donnees.ec.gc.ca/data/partnerships/grantscontributions/lake-winnipeg-basin-stewardship-fund-map-of-funded-projects</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gco:CharacterString>Voir le Dépôt de données d'EC</gco:CharacterString>
                </gmd:name>
                <gmd:description />
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:eng-CAN" xlink:title="tor112">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>http://intranet.ec.gc.ca/arcgis/rest/services/data-donnees/7816268a/MapServer/exts/GeoJSONServer/GeoJSON?query=true&amp;layer=0&amp;f=pjson</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gco:CharacterString>GeoJSON</gco:CharacterString>
                </gmd:name>
                <gmd:description gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            <gmd:onLine xlink:role="urn:xml:lang:fra-CAN" xlink:title="tor112">
                <gmd:CI_OnlineResource>
                <gmd:linkage>
                    <gmd:URL>GeoJSON</gmd:URL>
                </gmd:linkage>
                <gmd:protocol>
                    <gco:CharacterString>WWW:LINK-1.0-http--link</gco:CharacterString>
                </gmd:protocol>
                <gmd:name>
                    <gco:CharacterString>GeoJSON</gco:CharacterString>
                </gmd:name>
                <gmd:description gco:nilReason="missing">
                    <gco:CharacterString />
                </gmd:description>
                </gmd:CI_OnlineResource>
            </gmd:onLine>
            </gmd:MD_DigitalTransferOptions>
        </gmd:transferOptions>
        </gmd:MD_Distribution>
    </gmd:distributionInfo>
    </gmd:MD_Metadata>`;

/**
 * @module metadataService
 * @memberof app.geo
 *
 * @description
 * Retrieves and parses metadata in the format exposed by the data catalogue (TODO link to the spec if available).
 */
angular
    .module('app.geo')
    .factory('metadataService', metadataService);

function metadataService($q, $http, $translate, Geo) {

    const cache = {};

    const service = {
        loadFromURL
    };

    return service;

    /**
    * Applies an XSLT to XML, XML is provided but the XSLT is stored in a string constant.
    *
    * @method loadFromURL
    * @param {String} xmlUrl Location of the xml file
    * @param {Array} params an array which never seems to be set and is never used
    * @return {Promise} a promise resolving with an HTML fragment
    */
    function loadFromURL(xmlUrl, params) {

        if (cache.xmlUrl) {
            return $q.resolve(cache.xmlUrl);
        }

        // fill placeholders in XSLT with appropriate translations
        const xsltString = Geo.Metadata.XSLT_LANGUAGE_NEUTRAL.replace(/\{\{([\w\.]+)\}\}/g, (match, tag) =>
            $translate.instant(tag));

        // TODO: remove before deploying to prod :D :D :D
        return $q.resolve(applyXSLT(XML_SAMPLE, xsltString, params))
            .then(transformedXMLData => {
                cache.xmlUrl = transformedXMLData;
                return transformedXMLData;
            });

        /*return loadXmlFile(xmlUrl)
            .then(xmlData => applyXSLT(xmlData, xsltString, params))
            .then(transformedXMLData => {
                cache.xmlUrl = transformedXMLData;
                return transformedXMLData;
            })
            .catch(err => {
                console.error('Error: ' + err);
                throw err;
            });*/
    }

    /**
    * Transform XML using XSLT
    * @function applyXSLT
    * @private
    * @param {string} xmlString text data of the XML document
    * @param {string} xslString text data of the XSL document
    * in IE)}
    * @param {Array} params a list of paramters to apply to the transform
    * @return {object} transformed document
    */
    function applyXSLT(xmlString, xslString, params) {
        let output = null;

        if (window.XSLTProcessor) {
            const xsltProc = new window.XSLTProcessor();
            const xmlDoc = $.parseXML(xmlString);
            const xslDoc = $.parseXML(xslString);
            xsltProc.importStylesheet(xslDoc);
            // [patched from ECDMP] Add parameters to xsl document (setParameter = Chrome/FF/Others)
            if (params) {
                params.forEach(p => xsltProc.setParameter(null, p.key, p.value || ''));
            }
            output = xsltProc.transformToFragment(xmlDoc, document);
        } else if (window.hasOwnProperty('ActiveXObject')) {
            // IE11 (╯°□°）╯︵ ┻━┻
            const xslt = new window.ActiveXObject('Msxml2.XSLTemplate');
            const xmlDoc = new window.ActiveXObject('Msxml2.DOMDocument');
            const xslDoc = new window.ActiveXObject('Msxml2.FreeThreadedDOMDocument');
            xmlDoc.loadXML(xmlString);
            xslDoc.loadXML(xslString);
            xslt.stylesheet = xslDoc;
            const xsltProc = xslt.createProcessor();
            xsltProc.input = xmlDoc;
            if (params) {
                params.forEach(p => xsltProc.addParameter(p.key, p.value, ''));
            }
            xsltProc.transform();
            output = document.createRange().createContextualFragment(xsltProc.output);
        }

        return output;
    }

    /**
    * Loads a file via XHR.  Nothing XML specific.
    * @function loadXmlFile
    * @param {String} url URL to the file
    * @return {Promise} promise resolving with the text data of the file
    */
    function loadXmlFile(url) {
        return $http.get(url)
            .then(response => response.data)
            .catch(error => console.error(`XHR request failed. Error: ${error}`));
    }
}

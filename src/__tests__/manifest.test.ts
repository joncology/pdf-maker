import fs from 'fs';
import path from 'path';
import { describe, test, expect, beforeAll } from 'vitest';

describe('Manifest Validation', () => {
  let manifestContent: string;

  beforeAll(() => {
    const manifestPath = path.join(__dirname, '../../manifest.xml');
    manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  });

  test('manifest.xml exists and is valid XML', () => {
    expect(manifestContent).toBeDefined();
    expect(manifestContent.length).toBeGreaterThan(0);
    // Basic XML validation - should start with <?xml
    expect(manifestContent.trim().startsWith('<?xml')).toBe(true);
    // Should contain OfficeApp root element
    expect(manifestContent).toContain('<OfficeApp');
    expect(manifestContent).toContain('</OfficeApp>');
  });

  test('Host is Mailbox', () => {
    expect(manifestContent).toContain('<Host Name="Mailbox"/>');
  });

  test('Mailbox requirement is 1.15 or higher in root Requirements', () => {
    const rootRequirementsMatch = manifestContent.match(
      /<Requirements>[\s\S]*?<Set Name="Mailbox" MinVersion="([^"]+)"/
    );
    expect(rootRequirementsMatch).toBeTruthy();
    if (!rootRequirementsMatch) return;
    const minVersion = parseFloat(rootRequirementsMatch[1]!);
    expect(minVersion).toBeGreaterThanOrEqual(1.15);
  });

  test('SupportsMultiSelect is true', () => {
    expect(manifestContent).toContain('<SupportsMultiSelect>true</SupportsMultiSelect>');
  });

  test('VersionOverridesV1_1 is present', () => {
    expect(manifestContent).toContain('xsi:type="VersionOverridesV1_1"');
    expect(manifestContent).toContain('xmlns="http://schemas.microsoft.com/office/mailappversionoverrides/1.1"');
  });

  test('VersionOverridesV1_1 has Mailbox requirement 1.15', () => {
    // Match the nested VersionOverrides with DefaultMinVersion
    const nestedVersionMatch = manifestContent.match(
      /xmlns="http:\/\/schemas\.microsoft\.com\/office\/mailappversionoverrides\/1\.1"[\s\S]*?DefaultMinVersion="([^"]+)"/
    );
    expect(nestedVersionMatch).toBeTruthy();
    if (!nestedVersionMatch) return;
    const minVersion = parseFloat(nestedVersionMatch[1]!);
    expect(minVersion).toBeGreaterThanOrEqual(1.15);
  });

  test('Permissions include ReadWriteMailbox', () => {
    expect(manifestContent).toContain('<Permissions>ReadWriteMailbox</Permissions>');
  });

  test('DisplayName is PDF Maker', () => {
    expect(manifestContent).toContain('<DisplayName DefaultValue="PDF Maker"/>');
  });

  test('Nested VersionOverrides structure is correct', () => {
    // Verify the nesting: VersionOverridesV1_0 contains VersionOverridesV1_1
    const v10Match = manifestContent.match(
      /<VersionOverrides xmlns="http:\/\/schemas\.microsoft\.com\/office\/mailappversionoverrides" xsi:type="VersionOverridesV1_0">/
    );
    const v11Match = manifestContent.match(
      /<VersionOverrides xmlns="http:\/\/schemas\.microsoft\.com\/office\/mailappversionoverrides\/1\.1" xsi:type="VersionOverridesV1_1">/
    );
    expect(v10Match).toBeTruthy();
    expect(v11Match).toBeTruthy();
    expect(v10Match && v11Match).toBeTruthy();
  });
});

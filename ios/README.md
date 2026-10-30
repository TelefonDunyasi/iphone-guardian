# Native iOS build

This folder contains the first native SwiftUI implementation draft for iPhone Guardian.

## Requirements
- macOS with a current compatible Xcode release
- XcodeGen (install with Homebrew: `brew install xcodegen`)
- Apple Developer Program membership only when distributing through TestFlight/App Store

## Generate and open
From this folder on a Mac:

```sh
xcodegen generate
open iPhoneGuardian.xcodeproj
```

Select an iPhone simulator and build/run. Before distribution, set the final bundle identifier and signing team in Xcode.

## Important
The source has not been compiled or device-tested in this environment. Do not submit it until it builds cleanly and is tested on real iPhones. The iOS draft is local-first and intentionally has no account, analytics, ads, or payment system. The App Store advisor sends search terms to Apple's public catalog API.

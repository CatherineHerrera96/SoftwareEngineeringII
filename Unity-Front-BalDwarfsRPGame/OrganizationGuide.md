# Front-Proyect – Organization Guide

This document defines the conventions and best practices for project development, including folder structure, naming conventions, code style, and automated testing.

---

## 1. Folder Structure

```plaintext
Assets/
│
├── Art/                  # Models, sprites, textures, visual effects
│   ├── Characters/
│   ├── Environments/
│   └── UI/
│
├── Audio/                # Music and sound effects
│   ├── Music/
│   └── SFX/
│
├── Materials/            # Materials (.mat)
│
├── Prefabs/              # Reusable objects
│   ├── Characters/
│   ├── Props/
│   └── UI/
│
├── Scenes/               # Game scenes
│   ├── MainMenu.unity
│   ├── Level01.unity
│   └── TestScene.unity
│
├── Scripts/              # Source code
│   ├── Managers/
│   ├── Player/
│   ├── Enemies/
│   ├── Interactables/
│   └── UI/
│
├── Shaders/              # Custom shaders
│
├── Animation/            # Animation clips and controllers
│   ├── Characters/
│   └── Environment/
│
├── Resources/            # Files loaded at runtime
│
├── Plugins/              # External libraries
│
└── Tests/                # Automated tests
    ├── EditMode/
    └── PlayMode/
```

---

## 2. Naming Conventions

### Files and Folders

-   **PascalCase**: `MainMenu`, `ZombiePrefab.prefab`, `HealthSystem.cs`

### Scripts

-   Public classes: `EnemyAI.cs`, `GameManager.cs`
-   Interfaces: Use the prefix **"I"**
	- `IDamageable.cs`
-   Events: Use the prefix **"On"**
	- `OnPlayerDeath`, `OnItemCollected`

---

## 3. Testing

-   Framework: **Unity Test Framework**
-   Folder: `Assets/Tests/`
-   Types:
    -   `EditMode/` for logic without the engine.
    -   `PlayMode/` for testing with objects and scenes.
-   Conventions:
    -   Class names: `NameTests.cs`
    -   Method names: `Action_ExpectedResult`

### Example (EditMode)

```csharp
[Test] public void Health_Increases_OnHeal()
{
    var stats = new PlayerStats(100);
    stats.Heal(20);
    Assert.AreEqual(120, stats.CurrentHealth);
}
```

### Example (PlayMode)

```csharp
[UnityTest] public IEnumerator Enemy_Chases_Player_When_Seen()
{
    var enemy = GameObject.Instantiate(Resources.Load<GameObject>("Prefabs/Enemy"));
    var player = GameObject.Instantiate(Resources.Load<GameObject>("Prefabs/Player"));

    enemy.transform.position = Vector3.zero;
    player.transform.position = new Vector3(0, 0, 5);
    yield return new WaitForSeconds(2f);

    Assert.Greater(enemy.transform.position.z, 0f);
}
```

---

## 4. Version Control

-   Use `.gitignore` to exclude:
    -   `Library/`, `Temp/`, `Build/`, `Logs/`
-   Do not upload builds or executables.
-   Clear commit messages:
	- `feat:` For a new feature.
	- `fix:` For a bug fix.
	- `docs:` For documentation-only changes.
	- `style:` For code style changes (formatting, whitespace, semicolons, etc.) that don’t affect the code meaning.
	- `refactor:` For code refactors that don’t fix a bug or add a feature.

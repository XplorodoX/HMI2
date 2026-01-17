using UnityEngine;

public class test : MonoBehaviour
{
    public SkinnedMeshRenderer skinnedMeshRenderer;
    public Character character;

    [Header("Single Viseme Apply")]
    [Range(0, 14)]
    public int visemeIndexToApply = 0;

    [ContextMenu("Apply Viseme Blendshapes")]
    public void ApplyBlendshapes()
    {
        if (character == null)
        {
            Debug.LogError("Character is not assigned!");
            return;
        }
        //16,154,156,157,158,159,160,161,162,163,164 // for 2
        character.visemeToBlendTargets[0].blendShapes = new int[] { };

        //1
        character.visemeToBlendTargets[1].blendShapes = new int[] {
            140,141,142,143,144,145,238,239,262,263
        };
        character.visemeToBlendTargets[1].blendShapesweight = 0.5f;


        //2
        character.visemeToBlendTargets[2].blendShapes = new int[] {

            98,99,100,101
        };

        character.visemeToBlendTargets[2].blendShapes2 = new int[] {

            39,40,41,42,43,44,45,45,47,48,49
        };
        character.visemeToBlendTargets[2].blendShapesweight2 = 0.2f;
        //2
        character.visemeToBlendTargets[3].blendShapes = new int[] {
            16,152,153,158,159,160,161,162,163,164
        };
        character.visemeToBlendTargets[3].blendShapesweight = 0.5f;

        character.visemeToBlendTargets[4].blendShapes = new int[] {
            16,152,153,158,159,160,161,162,163,164
        };
        character.visemeToBlendTargets[4].blendShapesweight = 0.75f;

        character.visemeToBlendTargets[5].blendShapes = new int[] {
            5,
            158,159,160,161,162,163,164,165,166,167,
            3,6
        };

        character.visemeToBlendTargets[6].blendShapes = new int[] {
            158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175
        };

        character.visemeToBlendTargets[7].blendShapes = new int[] {
                30,31,32,33,90,91,92,93,266,267,262,263,
                98,99,100,101
        };

        character.visemeToBlendTargets[8].blendShapes = new int[] {
            158,159,163,164
        };
        character.visemeToBlendTargets[8].blendShapesweight = 0.6f;

        character.visemeToBlendTargets[9].blendShapes = new int[] {
             168,169,170,171,172,173,174,175
        };

        character.visemeToBlendTargets[10].blendShapes = new int[] {
           158,159,163,164
        };

        character.visemeToBlendTargets[10].blendShapesweight = 0.6f;

        character.visemeToBlendTargets[11].blendShapes = new int[] {
            26,27,28,29,30,31,32,33,168,169,170,171,262,263,266,267
        };

        character.visemeToBlendTargets[12].blendShapes = new int[] {
            76,77,78,79,80,81,82,83,84,85
        };

        character.visemeToBlendTargets[13].blendShapes = new int[] {
            98,99,100,101
        };

        character.visemeToBlendTargets[14].blendShapes = new int[] {
            116,117,118,119,120,121
        };

        Debug.Log("Viseme blendshapes applied!");
    }

    [ContextMenu("Apply Single Viseme")]
    public void ApplySingleViseme()
    {
        if (character == null || skinnedMeshRenderer == null)
        {
            Debug.LogError("Character or SkinnedMeshRenderer is not assigned!");
            return;
        }

        if (visemeIndexToApply < 0 || visemeIndexToApply >= character.visemeToBlendTargets.Length)
        {
            Debug.LogError("Viseme index out of range!");
            return;
        }

        // 1️⃣ Disable ALL blendshapes first
        ResetAllBlendshapes();

        // 2️⃣ Apply selected viseme
        ApplyViseme(visemeIndexToApply);

        Debug.Log("Applied viseme index: " + visemeIndexToApply);
    }

    [ContextMenu("Reset All")]
    // 🔄 Set all blendshape weights to 0
    public void ResetAllBlendshapes()
    {
        int blendShapeCount = skinnedMeshRenderer.sharedMesh.blendShapeCount;

        for (int i = 0; i < blendShapeCount; i++)
        {
            skinnedMeshRenderer.SetBlendShapeWeight(i, 0f);
        }
    }

    // 🎯 Apply one viseme by setting all its blendshapes to 100
    private void ApplyViseme(int i)
    {
        for (int j = 0; j < character.visemeToBlendTargets[i].blendShapes.Length; j++)
        {
            skinnedMeshRenderer.SetBlendShapeWeight(character.visemeToBlendTargets[i].blendShapes[j], 100f * character.visemeToBlendTargets[i].blendShapesweight);
        }

        for (int j = 0; j < character.visemeToBlendTargets[i].blendShapes2.Length; j++)
        {
            skinnedMeshRenderer.SetBlendShapeWeight(character.visemeToBlendTargets[i].blendShapes2[j], 100f * character.visemeToBlendTargets[i].blendShapesweight2);
        }

        for (int j = 0; j < character.visemeToBlendTargets[i].blendShapes3.Length; j++)
        {
            skinnedMeshRenderer.SetBlendShapeWeight(character.visemeToBlendTargets[i].blendShapes3[j], 100f * character.visemeToBlendTargets[i].blendShapesweight3);
        }
    }
}
